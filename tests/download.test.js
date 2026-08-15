import { describe, it, expect, beforeEach, vi } from "vitest";
import { Download, Inventory } from "../MIFCSheet/classes.js";

class MockJSZip {
  static lastInstance = null;

  constructor() {
    this.files = [];
    MockJSZip.lastInstance = this;
  }

  file(name, data, options = {}) {
    this.files.push({ name, data, options });
    return this;
  }

  generateAsync() {
    return Promise.resolve("mock-blob");
  }
}

describe("Download", () => {
  beforeEach(() => {
    globalThis.JSZip = MockJSZip;
    globalThis.saveAs = vi.fn();
    MockJSZip.lastInstance = null;
  });

  it("uses the display_col value in the ZIP filename", () => {
    const inventory = new Inventory(
      { name: "PLOT-23", comment: "Zaragoza" },
      23
    );

    const inventories = {
      selectById: () => inventory
    };

    const download = new Download(23, inventories);

    expect(download.foldername).toBe("inventory_PLOT-23.zip");
  });

  it("sanitizes characters that are unsafe in filenames", () => {
    const inventory = new Inventory(
      { name: "PLOT/23:A", comment: "Zaragoza" },
      23
    );

    const inventories = {
      selectById: () => inventory
    };

    const download = new Download(23, inventories);

    expect(download.foldername).not.toMatch(/[<>:"/\\|?*]/);
    expect(download.foldername).toMatch(/^inventory_.+\.zip$/);
  });

  it("exports requested columns even when values are missing", () => {
    const download = Object.create(Download.prototype);

    const csv = download.arrayToCsv(
      [{ name: "PLOT-1", comment: undefined }],
      ["name", "init_point_id", "comment"]
    );

    expect(csv).toBe(
      "name,init_point_id,comment\nPLOT-1,,"
    );
  });

  it("escapes commas, quotes, and line breaks in CSV values", () => {
    const download = Object.create(Download.prototype);

    const csv = download.arrayToCsv([
      {
        name: "PLOT-1",
        comment: 'Tree, marked "A"\nchecked'
      }
    ]);

    expect(csv).toContain(
      '"Tree, marked ""A""\nchecked"'
    );
  });

  it("exports rown as row_id and removes the internal IndexedDB row id", async () => {
    const download = Object.create(Download.prototype);

    download.foldername = "inventory_PLOT-1.zip";
    download.inventory = {
      name: "PLOT-1",
      id: 10,
      created_at: "2026-01-01T10:00:00.000Z"
    };
    download.rows = [
      {
        id: 17,
        rown: 1,
        inventories_id: 10,
        species: "Balsam Fir"
      }
    ];
    download.inv_imgs = [];
    download.row_imgs = [];

    await download.download();

    const rowsFile = MockJSZip.lastInstance.files.find(
      (file) => file.name === "rows.csv"
    );

    expect(rowsFile).toBeDefined();

    const [header, row] = rowsFile.data.split("\n");
    const columns = header.split(",");

    expect(columns).toContain("row_id");
    expect(columns).not.toContain("id");
    expect(row.split(",")[columns.indexOf("row_id")]).toBe("1");
  });

  it("names row images using the inventory row number instead of the IndexedDB row id", async () => {
    const download = Object.create(Download.prototype);

    download.foldername = "inventory_PLOT-1.zip";
    download.inventory = {
      name: "PLOT-1",
      id: 10,
      created_at: "2026-01-01T10:00:00.000Z"
    };
    download.rows = [
      {
        id: 17,
        rown: 1,
        inventories_id: 10,
        species: "Balsam Fir"
      }
    ];
    download.inv_imgs = [];
    download.row_imgs = [
      {
        id: 8,
        rows_id: 17,
        inventories_id: 10,
        src: "data:image/jpeg;base64,AA==",
        extension: "jpg"
      }
    ];

    download.transformImage = vi.fn().mockResolvedValue(
      new Uint8Array([1, 2, 3])
    );

    await download.download();

    const filenames = MockJSZip.lastInstance.files.map(
      (file) => file.name
    );

    expect(filenames).toContain(
      "row_images/row_1_image_8.jpg"
    );
    expect(filenames).not.toContain(
      "row_images/row_17_image_8.jpg"
    );
  });

  it("throws if a row image cannot be matched to an inventory row number", async () => {
    const download = Object.create(Download.prototype);

    download.foldername = "inventory_PLOT-1.zip";
    download.inventory = {
      name: "PLOT-1",
      id: 10,
      created_at: "2026-01-01T10:00:00.000Z"
    };
    download.rows = [
      {
        id: 17,
        rown: 1,
        inventories_id: 10
      }
    ];
    download.inv_imgs = [];
    download.row_imgs = [
      {
        id: 8,
        rows_id: 99,
        inventories_id: 10,
        src: "data:image/jpeg;base64,AA==",
        extension: "jpg"
      }
    ];

    download.transformImage = vi.fn().mockResolvedValue(
      new Uint8Array([1, 2, 3])
    );

    await expect(download.download()).rejects.toThrow(
      /row number/i
    );
  });
});