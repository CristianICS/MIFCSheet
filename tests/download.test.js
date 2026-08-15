import { describe, it, expect } from "vitest";
import { Download, Inventory } from "../MIFCSheet/classes.js";

describe("Download", () => {
  it("uses the display_col value in the ZIP filename", () => {
    const inventory = new Inventory(
      { plot_id: "PLOT-23", location: "Zaragoza" },
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
      { plot_id: "PLOT/23:A", location: "Zaragoza" },
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
      [{ plot_id: "PLOT-1", location: undefined }],
      ["plot_id", "location", "comment"]
    );

    expect(csv).toBe(
      "plot_id,location,comment\nPLOT-1,,"
    );
  });

  it("escapes commas, quotes, and line breaks in CSV values", () => {
    const download = Object.create(Download.prototype);

    const csv = download.arrayToCsv([
      {
        plot_id: "PLOT-1",
        comment: 'Tree, marked "A"\nchecked'
      }
    ]);

    expect(csv).toContain(
      '"Tree, marked ""A""\nchecked"'
    );
  });
});
