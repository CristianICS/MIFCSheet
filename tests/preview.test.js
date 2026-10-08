import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  TRANSECT_LENGTH_CM,
  isMifcInventory,
  rowsToPlants,
  validatePlants,
  speciesColors,
  renderPlanView,
  renderProfileView,
  renderLegend,
  renderWarnings,
  buildPreviewSvg,
  svgToPngBlob,
  openPreview,
  initPreviewButton
} from "../MIFCSheet/preview.js";
import { Inventory } from "../MIFCSheet/classes.js";

/** Evaluate a config file the way the browser loads it (classic script). */
function loadConfig(path) {
  // Paths are relative to the repository root (where vitest runs)
  const src = readFileSync(resolve(path), "utf8");
  // Declare inv_type locally so configs without it don't read the global one
  return new Function(`var inv_type;\n${src}\nreturn { inv_columns, inv_type };`)();
}

function useMifcConfig() {
  const { inv_columns, inv_type } = loadConfig("MIFCSheet/form_columns.js");
  globalThis.inv_columns = inv_columns;
  globalThis.inv_type = inv_type;
}

// Rows mirroring the cases described in UPGRADE.md
const ROWS = [
  { rown: 1, species: "Larix decidua", d: 50, dl: 20, h: 50, rma: 30, rmi: 20, dbh_cm: 12 },
  { rown: 2, species: "Larix decidua", d: 150, dr: 30, h: 52, dma: 40 },
  { rown: 3, species: "Pinus sylvestris", d: 300, h: 60 },
  { rown: 4, species: "Pinus sylvestris", d: "", dl: 10, h: 40 },
  { rown: 5, species: "Pinus sylvestris", d: 400, dl: 10, dr: 20, h: 45 },
  { rown: 7, species: "Larix decidua", d: 500, dl: 10, h: 4500.41 },
  { rown: 11, species: "Larix decidua", d: 600, dl: 10, h: 5400.3, rma: 10, rmi: 20, dma: 3 },
  { rown: 18, species: "Pinus sylvestris", d: 900, dr: 10, h: 7200.4 }
];

const countPlants = (svg) => (svg.match(/<g class="plant/g) ?? []).length;

/** Rows of the original 32-plant example inventory (no quoted fields). */
function loadExampleRows() {
  const [header, ...lines] = readFileSync(
    resolve("tests/fixtures/mifc_example_rows.csv"), "utf8"
  ).trim().split(/\r?\n/);
  const columns = header.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(columns.map((col, i) => [col, values[i]]));
  });
}

beforeEach(() => {
  useMifcConfig();
});

afterEach(() => {
  delete globalThis.inv_type;
  document.body.innerHTML = "";
});

describe("isMifcInventory", () => {
  it("is true for the official MIFC config", () => {
    expect(isMifcInventory()).toBe(true);
  });

  it("is false without inv_type", () => {
    delete globalThis.inv_type;
    expect(isMifcInventory()).toBe(false);
  });

  it("is false for Canada_NFI-style columns", () => {
    const canada = loadConfig("Canada_NFI/form_columns.js");
    expect(canada.inv_type).toBeUndefined();
    globalThis.inv_columns = canada.inv_columns;
    expect(isMifcInventory()).toBe(false);
  });
});

describe("rowsToPlants", () => {
  it("uses +dl on the left and -dr on the right", () => {
    const [left, right, none, , both] = rowsToPlants(ROWS);
    expect(left.y).toBe(20);
    expect(right.y).toBe(-30);
    expect(none.y).toBe(0);
    expect(both.y).toBeNull();
  });

  it("doubles radii and keeps diameters", () => {
    const [radius, diameter] = rowsToPlants(ROWS);
    expect(radius.crownMajor).toBe(60);
    expect(radius.crownMinor).toBe(40);
    // Only dma given: circle
    expect(diameter.crownMajor).toBe(40);
    expect(diameter.crownMinor).toBe(40);
  });

  it("prefers radii when both crown measures exist", () => {
    const plant = rowsToPlants([{ d: 10, rma: 5, dma: 100, dmi: 80 }])[0];
    expect(plant.crownMajor).toBe(10);
    expect(plant.crownMinor).toBe(10);
  });

  it("leaves the crown empty without measures", () => {
    const plant = rowsToPlants([ROWS[2]])[0];
    expect(plant.crownMajor).toBeNull();
    expect(plant.crownMinor).toBeNull();
  });

  it("turns blank and non-numeric values into null", () => {
    const plant = rowsToPlants([{ d: "", h: "abc", dbh_cm: NaN, dl: "12.5" }])[0];
    expect(plant.x).toBeNull();
    expect(plant.h).toBeNull();
    expect(plant.dbh).toBeNull();
    expect(plant.y).toBe(12.5);
  });

  it("falls back to the row position when rown is missing", () => {
    const plants = rowsToPlants([{ d: 1 }, { d: 2 }]);
    expect(plants.map((p) => p.rown)).toEqual([1, 2]);
  });
});

describe("validatePlants", () => {
  it("flags rows 11 and 18 above the h maximum, not row 7", () => {
    const { warnings } = validatePlants(rowsToPlants(ROWS));
    const hRows = warnings.filter((w) => w.key === "h").map((w) => w.rown);
    expect(hRows).toEqual([11, 18]);
    expect(warnings.find((w) => w.rown === 11 && w.key === "h").reason)
      .toBe("h = 5400.3 is above the maximum (5000)");
  });

  it("marks missing d and both sides as errors (not drawn)", () => {
    const { plants, warnings } = validatePlants(rowsToPlants(ROWS));
    const byRow = (n) => plants.find((p) => p.rown === n);
    expect(byRow(4).drawable).toBe(false);
    expect(byRow(5).drawable).toBe(false);
    expect(warnings).toContainEqual(expect.objectContaining({ rown: 4, level: "error", key: "d" }));
    expect(warnings).toContainEqual(expect.objectContaining({ rown: 5, level: "error", key: "dl" }));
    expect(byRow(1).drawable).toBe(true);
    expect(byRow(1).flags).toEqual([]);
  });

  it("warns about missing side, swapped axes and mixed crown measures", () => {
    const { plants } = validatePlants(rowsToPlants(ROWS));
    const keys = (n) => plants.find((p) => p.rown === n).flags.map((f) => f.key);
    expect(keys(3)).toEqual(["dl"]);
    expect(keys(11)).toEqual(expect.arrayContaining(["h", "rmi", "dma"]));
    expect(plants.find((p) => p.rown === 11).drawable).toBe(true);
  });
});

describe("example inventory", () => {
  const rows = loadExampleRows();

  it("loads the 32 example rows", () => {
    expect(rows.length).toBe(32);
  });

  it("flags only rows 11 and 18 (h above 5000), not row 7", () => {
    const { plants, warnings } = validatePlants(rowsToPlants(rows));
    expect(warnings.map(({ rown, key, level }) => ({ rown, key, level }))).toEqual([
      { rown: 11, key: "h", level: "warning" },
      { rown: 18, key: "h", level: "warning" }
    ]);
    expect(warnings.map((w) => w.reason)).toEqual([
      "h = 5400.3 is above the maximum (5000)",
      "h = 7200.4 is above the maximum (5000)"
    ]);
    const row7 = plants.find((p) => p.rown === 7);
    expect(row7.h).toBe(4500.41);
    expect(row7.flags).toEqual([]);
  });

  it("treats NaN cells as empty", () => {
    const [first] = rowsToPlants(rows);
    expect(first.y).toBe(36);
    expect(first.dbh).toBeNull();
    expect(first.crownMajor).toBe(10);
    expect(first.crownMinor).toBe(3);
  });

  it("draws every plant, a 2-species legend and the warnings", () => {
    const { plants } = validatePlants(rowsToPlants(rows));
    expect(plants.every((p) => p.drawable)).toBe(true);
    expect(countPlants(renderPlanView(plants))).toBe(32);
    expect(countPlants(renderProfileView(plants))).toBe(32);

    const legend = renderLegend(plants);
    expect(legend).toContain("Larix laricina (12)");
    expect(legend).toContain("Picea abies (20)");

    const svg = buildPreviewSvg(plants, { name: "example" });
    expect(svg).toContain("Warnings (2)");
    expect(svg).toContain("Row 11: h = 5400.3 is above the maximum (5000)");
  });
});

describe("rendering", () => {
  it("assigns colours in order of first appearance", () => {
    const colors = speciesColors(rowsToPlants(ROWS));
    expect([...colors.keys()]).toEqual(["Larix decidua", "Pinus sylvestris"]);
  });

  it("draws one shape per drawable plant", () => {
    const { plants } = validatePlants(rowsToPlants(ROWS));
    const drawable = plants.filter((p) => p.drawable).length;
    expect(drawable).toBe(6);
    expect(countPlants(renderPlanView(plants))).toBe(drawable);
    expect(countPlants(renderProfileView(plants))).toBe(drawable);
  });

  it("labels the transect ends with the point IDs", () => {
    const svg = renderPlanView(rowsToPlants(ROWS), { init_point_id: 7, final_point_id: 8 });
    expect(svg).toContain("Point 7");
    expect(svg).toContain("Point 8");
    expect(svg).toContain(`>${TRANSECT_LENGTH_CM}<`);
  });

  it("cuts off plants above the profile maximum and shows their value", () => {
    const svg = renderProfileView(rowsToPlants(ROWS));
    expect(svg).toContain(">5400.3<");
    expect(svg).toContain(">7200.4<");
    expect(svg).not.toContain(">4500.41<");
  });

  it("pins plants outside the transect to its edge and labels them", () => {
    const plants = rowsToPlants([
      { rown: 1, d: 9800, dl: 10, h: 50 },
      { rown: 2, d: -20, dr: 900, h: 50 }
    ]);
    const plan = renderPlanView(plants);
    // 60 px left margin + 1 px per cm
    expect(plan).toContain('cx="1060"');
    expect(plan).toContain('cx="60"');
    expect(plan).toContain(">d 9800, dl 10<");
    expect(plan).toContain(">d -20, dr 900<");
    // dr 900 is pinned to the 400 cm limit below the tape (tape at y = 430)
    expect(plan).toContain('cy="830"');

    // Stems start on the ground line (y = 330)
    const profile = renderProfileView(plants);
    expect(profile).toContain('x1="1060" y1="330" x2="1060"');
    expect(profile).toContain('x1="60" y1="330" x2="60"');
  });

  it("doesn't label plants inside the transect", () => {
    expect(renderPlanView(rowsToPlants([{ d: 500, dl: 10 }]))).not.toContain(">d 500");
  });

  it("builds a legend with 2 species and the flagged marker", () => {
    const svg = renderLegend(rowsToPlants(ROWS));
    expect(svg).toContain("Larix decidua (4)");
    expect(svg).toContain("Pinus sylvestris (4)");
    expect(svg).toContain("Flagged value");
  });

  it("renders a clickable warnings list", () => {
    const { warnings } = validatePlants(rowsToPlants(ROWS));
    const list = renderWarnings(warnings);
    expect(list.querySelectorAll(".preview-warning").length).toBe(warnings.length);
    expect(list.querySelector('[data-rown="18"][data-key="h"]')).not.toBeNull();
    expect(renderWarnings([]).textContent).toBe("No warnings.");
  });

  it("builds one valid combined SVG with title and warnings", () => {
    const svg = buildPreviewSvg(rowsToPlants(ROWS), { name: "A & B" });
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.getElementsByTagName("parsererror").length).toBe(0);
    expect(svg).toContain("Transect A &amp; B");
    expect(svg).toContain("Warnings (");
    expect(countPlants(svg)).toBe(12); // plan + profile
  });

  it("escapes species names", () => {
    const svg = renderLegend(rowsToPlants([{ species: "<b>x</b>", d: 1 }]));
    expect(svg).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(svg).not.toContain("<b>");
  });

  it("rejects SVGs without a size", async () => {
    await expect(svgToPngBlob("<svg></svg>")).rejects.toThrow();
  });
});

describe("openPreview", () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<div id="block-app-div" style="display:none"></div>' +
      '<div id="rown-18" class="inv-row"><input id="h-18"></div>';
  });

  it("opens the modal with plan / profile tabs", () => {
    const container = openPreview(rowsToPlants(ROWS), { name: "T1" });
    expect(container.style.display).toBe("block");
    expect(document.getElementById("block-app-div").style.display).toBe("block");
    expect(container.querySelector(".preview-view svg")).not.toBeNull();

    const profileTab = container.querySelector('[data-view="profile"]');
    profileTab.click();
    expect(profileTab.getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector(".preview-view").innerHTML).toContain("h (cm)");
  });

  it("shows plant details on tap", () => {
    const container = openPreview(rowsToPlants(ROWS));
    container.querySelector('.preview-view .plant[data-rown="1"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(container.querySelector(".preview-tooltip").textContent)
      .toBe("Row 1: Larix decidua · h 50 cm · DBH 12 cm");
  });

  it("closes and highlights the row input when a warning is tapped", () => {
    const container = openPreview(rowsToPlants(ROWS));
    container.querySelector('.preview-warning[data-rown="18"][data-key="h"]').click();
    expect(container.style.display).toBe("none");
    expect(document.getElementById("block-app-div").style.display).toBe("none");
    expect(document.getElementById("h-18").classList.contains("preview-highlight")).toBe(true);
  });

  it("hands a tapped warning to onWarning instead of highlighting", () => {
    const onWarning = vi.fn();
    const container = openPreview(rowsToPlants(ROWS), {}, { onWarning });
    container.querySelector('.preview-warning[data-rown="18"][data-key="h"]').click();
    expect(container.style.display).toBe("none");
    expect(onWarning).toHaveBeenCalledWith("18", "h");
    expect(document.getElementById("h-18").classList.contains("preview-highlight")).toBe(false);
  });

  it("closes with the cross", () => {
    const container = openPreview(rowsToPlants(ROWS));
    container.querySelector("#close-preview-container span").click();
    expect(container.style.display).toBe("none");
  });

  it("reuses the #preview-container from index.html", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="preview-container" style="display:none;"></div>'
    );
    const existing = document.getElementById("preview-container");
    expect(openPreview(rowsToPlants(ROWS))).toBe(existing);
    expect(document.querySelectorAll("#preview-container").length).toBe(1);
  });
});

describe("UI entry points", () => {
  const rowControls = () => {
    document.body.innerHTML =
      '<p><button type="button" id="row-btn-img">Add picture</button></p>';
  };

  it("adds the preview button for MIFC, once", () => {
    rowControls();
    expect(initPreviewButton()).not.toBeNull();
    expect(initPreviewButton()).toBeNull();
    const buttons = document.querySelectorAll("#row-btn-preview");
    expect(buttons.length).toBe(1);
    expect(buttons[0].previousElementSibling.id).toBe("row-btn-img");
  });

  it("has no preview button for non-MIFC configs", () => {
    delete globalThis.inv_type;
    rowControls();
    expect(initPreviewButton()).toBeNull();
    expect(document.getElementById("row-btn-preview")).toBeNull();
  });

  it("adds a preview link to saved MIFC inventories", () => {
    const element = new Inventory({ name: "T1" }, 5).toHtml();
    const ids = [...element.querySelectorAll("a")].map((a) => a.id);
    expect(ids).toEqual(["open-5", "preview-5", "download-5", "delete-5"]);
  });

  it("has no preview link for non-MIFC configs", () => {
    delete globalThis.inv_type;
    const element = new Inventory({ name: "T1" }, 5).toHtml();
    expect(element.querySelector("#preview-5")).toBeNull();
  });
});
