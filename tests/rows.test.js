import { describe, it, expect, beforeEach, vi } from "vitest";
import { Rows, Row } from "../MIFCSheet/classes.js";

describe("Row", () => {
  it("creates a row with configured columns", () => {
    const rows = [];
    const row = new Row(rows, false, {
      species: "Pinus halepensis",
      dbh_cm: 23.5,
      tree: 2,
      status: "LS"
    });

    expect(row.rown).toBe(1);
    expect(row.species).toBe("Pinus halepensis");
    expect(row.dbh_cm).toBe(23.5);
    expect(row.tree).toBe(2);
  });

  it("renders a row as HTML", () => {
    const row = new Row([], 5, {
      species: "Pinus halepensis",
      dbh_cm: 23.5,
      tree: 2,
      status: "LS"
    });

    const element = row.toHtml();

    expect(element.id).toBe("rown-1");
    expect(element.dataset.id).toBe("5");
    expect(element.querySelector("#species-1").value).toBe("Pinus halepensis");
    expect(element.querySelector("#dbh_cm-1").value).toBe("23.5");
  });

  it("adds an empty default option to row select fields", () => {
    const row = new Row([], false, {
      species: "",
      dbh_cm: "",
      tree: "",
      status: ""
    });

    const select = row.toHtml().querySelector("#status-1");

    expect(select.options[0].value).toBe("");
    expect(select.value).toBe("");
  });

  it("propagates the promise returned by IndexedDB when saving", async () => {
    const row = new Row([], false, {
      species: "Pinus",
      dbh_cm: 20,
      tree: 1,
      status: "LS"
    });

    const dbHandler = {
      addData: vi.fn(() => Promise.resolve("saved"))
    };

    await expect(
      row.save({ inventories_id: 3 }, dbHandler)
    ).resolves.toBe("saved");

    expect(dbHandler.addData).toHaveBeenCalledWith(
      { inventories_id: 3 },
      "rows"
    );
  });

  it("deletes linked row images before deleting a stored row", async () => {
    const row = new Row([], 5, {
      species: "Pinus",
      dbh_cm: 20,
      tree: 1,
      status: "LS"
    });

    const dbHandler = {
      deleteRecords: vi.fn(() => Promise.resolve()),
      deleteRecord: vi.fn(() => Promise.resolve())
    };

    await row.delete(dbHandler);

    expect(dbHandler.deleteRecords).toHaveBeenCalledWith(
      5,
      "rows_id",
      "row_images"
    );
    expect(dbHandler.deleteRecord).toHaveBeenCalledWith(5, "rows");

    expect(
      dbHandler.deleteRecords.mock.invocationCallOrder[0]
    ).toBeLessThan(
      dbHandler.deleteRecord.mock.invocationCallOrder[0]
    );
  });
});

describe("Rows", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <fieldset id="rows-fieldset">
        <div id="rown-1" class="inv-row" data-id="3">
          <input id="species-1" value="Pinus halepensis" />
          <input id="dbh_cm-1" value="23.5" />
          <input id="tree-1" value="2" />
          <select id="status-1">
            <option value=""></option>
            <option value="LS" selected>LS</option>
          </select>
        </div>
      </fieldset>
    `;
  });

  it("collects rows from the DOM and casts numeric fields", () => {
    const rows = new Rows();

    rows.collect();

    expect(rows.arrays).toHaveLength(1);
    expect(rows.arrays[0].id).toBe(3);
    expect(rows.arrays[0].species).toBe("Pinus halepensis");
    expect(rows.arrays[0].dbh_cm).toBe(23.5);
    expect(rows.arrays[0].tree).toBe(2);
    expect(rows.arrays[0].status).toBe("LS");
  });

  it("keeps blank numeric fields blank instead of storing NaN", () => {
    document.querySelector("#dbh_cm-1").value = "";
    document.querySelector("#tree-1").value = "";

    const rows = new Rows();
    rows.collect();

    expect(rows.arrays[0].dbh_cm).toBe("");
    expect(rows.arrays[0].tree).toBe("");
    expect(Number.isNaN(rows.arrays[0].dbh_cm)).toBe(false);
    expect(Number.isNaN(rows.arrays[0].tree)).toBe(false);
  });

  it("waits until every row save promise has resolved", async () => {
    const rows = new Rows();

    let resolveFirst;
    let resolveSecond;

    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    rows.arrays = [
      {
        parseIdb: () => ({ species: "Pinus" }),
        save: vi.fn(() => firstPromise)
      },
      {
        parseIdb: () => ({ species: "Quercus" }),
        save: vi.fn(() => secondPromise)
      }
    ];

    let finished = false;
    const savePromise = rows.save(8, {}).then(() => {
      finished = true;
    });

    await Promise.resolve();
    expect(finished).toBe(false);

    resolveFirst();
    await Promise.resolve();
    expect(finished).toBe(false);

    resolveSecond();
    await savePromise;
    expect(finished).toBe(true);
  });

  it("propagates a row-save rejection", async () => {
    const rows = new Rows();

    rows.arrays = [
      {
        parseIdb: () => ({ species: "Pinus" }),
        save: vi.fn(() => Promise.resolve())
      },
      {
        parseIdb: () => ({ species: "Quercus" }),
        save: vi.fn(() => Promise.reject(new Error("write failed")))
      }
    ];

    await expect(rows.save(8, {})).rejects.toThrow("write failed");
  });
});
