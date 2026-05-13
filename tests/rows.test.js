import { describe, it, expect, beforeEach } from "vitest";
import { Rows, Row } from "../MIFCSheet/classes.js";

describe("Row", () => {
  it("creates a row with configured columns", () => {
    const rows = [];
    const row = new Row(rows, false, {
      species: "Pinus halepensis",
      dbh: 23.5,
      n: 2
    });

    expect(row.rown).toBe(1);
    expect(row.species).toBe("Pinus halepensis");
    expect(row.dbh).toBe(23.5);
    expect(row.n).toBe(2);
  });

  it("renders a row as HTML", () => {
    const rows = [];
    const row = new Row(rows, 5, {
      species: "Pinus halepensis",
      dbh: 23.5,
      n: 2
    });

    const element = row.toHtml();

    expect(element.id).toBe("rown-1");
    expect(element.dataset.id).toBe("5");
    expect(element.querySelector("#species-1").value).toBe("Pinus halepensis");
    expect(element.querySelector("#dbh-1").value).toBe("23.5");
  });
});

describe("Rows", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <fieldset id="rows-fieldset">
        <div id="rown-1" class="inv-row" data-id="3">
          <input id="species-1" value="Pinus halepensis" />
          <input id="dbh-1" value="23.5" />
          <input id="n-1" value="2" />
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
    expect(rows.arrays[0].dbh).toBe(23.5);
    expect(rows.arrays[0].n).toBe(2);
  });
});