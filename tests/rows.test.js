import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  Rows,
  Row,
  checkRange,
  outOfRangeMessage,
  init_inventory_panel
} from "../MIFCSheet/classes.js";

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

describe("Range validation", () => {
  beforeEach(() => {
    globalThis.inv_columns.dbh_cm.min = 0;
    globalThis.inv_columns.dbh_cm.max = 500;
  });

  it("checkRange flags values below and above the limits", () => {
    expect(checkRange("dbh_cm", 600)).toEqual({
      key: "dbh_cm",
      value: 600,
      min: 0,
      max: 500,
      reason: "dbh_cm = 600 is above the maximum (500)"
    });
    expect(checkRange("dbh_cm", -1).reason).toBe(
      "dbh_cm = -1 is below the minimum (0)"
    );
  });

  it("checkRange ignores values inside the limits, blanks and unlimited columns", () => {
    expect(checkRange("dbh_cm", 0)).toBeNull();
    expect(checkRange("dbh_cm", 500)).toBeNull();
    expect(checkRange("dbh_cm", "")).toBeNull();
    expect(checkRange("tree", 99999)).toBeNull();
    expect(checkRange("species", "Pinus")).toBeNull();
    expect(checkRange("unknown", 1)).toBeNull();
  });

  it("flags negative point IDs with the official inventory header", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("MIFCSheet/inventory_header.js", "utf8");
    const header = new Function(`${src}\nreturn inv_header;`)();

    expect(checkRange("init_point_id", -3, header).reason).toBe(
      "init_point_id = -3 is below the minimum (0)"
    );
    expect(checkRange("final_point_id", 0, header)).toBeNull();
    expect(checkRange("final_point_id", 123456, header)).toBeNull();
  });

  it("checkRange accepts a custom configuration (inventory header)", () => {
    globalThis.inv_header.init_point_id.max = 100;

    expect(checkRange("init_point_id", 101, inv_header).reason).toBe(
      "init_point_id = 101 is above the maximum (100)"
    );
    expect(checkRange("init_point_id", 101)).toBeNull();
  });

  it("toHtml sets min/max only on columns with limits", () => {
    const element = new Row([], false, { dbh_cm: 20, tree: 1 }).toHtml();
    const dbh = element.querySelector("#dbh_cm-1");
    const tree = element.querySelector("#tree-1");

    expect(dbh.getAttribute("min")).toBe("0");
    expect(dbh.getAttribute("max")).toBe("500");
    expect(tree.hasAttribute("min")).toBe(false);
    expect(tree.hasAttribute("max")).toBe(false);
  });

  it("shows and removes an inline message when an out-of-range value changes", () => {
    const element = new Row([], false, { dbh_cm: 600 }).toHtml();
    const dbh = element.querySelector("#dbh_cm-1");

    dbh.dispatchEvent(new Event("change"));
    expect(element.querySelector(".range-warning").textContent).toBe(
      "dbh_cm = 600 is above the maximum (500)"
    );

    dbh.value = "20";
    dbh.dispatchEvent(new Event("change"));
    expect(element.querySelector(".range-warning")).toBeNull();
  });

  it("adds limits and the inline message to inventory header fields", () => {
    globalThis.inv_header.init_point_id.max = 100;
    document.body.innerHTML =
      '<form id="inventory-form"><fieldset></fieldset></form>';

    init_inventory_panel();
    const input = document.querySelector("#inventory-init_point_id");

    expect(input.getAttribute("max")).toBe("100");
    input.value = "150";
    input.dispatchEvent(new Event("change"));
    expect(input.parentNode.querySelector(".range-warning").textContent).toBe(
      "init_point_id = 150 is above the maximum (100)"
    );
  });

  it("lists out-of-range rows and builds a single confirmation message", () => {
    const rows = new Rows();
    rows.arrays = [
      new Row([], 1, { dbh_cm: 20 }, 1),
      new Row([], 2, { dbh_cm: 600 }, 11),
      new Row([], 3, { dbh_cm: 700 }, 18)
    ];

    const issues = rows.outOfRange();

    expect(issues.map((issue) => issue.rown)).toEqual([11, 18]);
    expect(outOfRangeMessage(issues)).toBe(
      "2 values are out of range (rows 11, 18). Save anyway?"
    );
  });

  it("mentions the inventory header in the confirmation message", () => {
    const headerIssue = checkRange("dbh_cm", 600);
    const rowIssue = { ...checkRange("dbh_cm", 700), rown: 4 };

    expect(outOfRangeMessage([headerIssue])).toBe(
      "1 value is out of range (inventory header). Save anyway?"
    );
    expect(outOfRangeMessage([rowIssue, headerIssue])).toBe(
      "2 values are out of range (row 4; inventory header). Save anyway?"
    );
  });
});
