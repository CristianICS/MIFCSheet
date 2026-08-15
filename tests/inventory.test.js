import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Inventory, Inventories } from "../MIFCSheet/classes.js";

describe("Inventory", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates an inventory only from configured metadata", () => {
    const inventory = new Inventory({
      plot_id: "Plot 1",
      location: "Zaragoza",
      ignored: "not stored"
    });

    expect(inventory.plot_id).toBe("Plot 1");
    expect(inventory.location).toBe("Zaragoza");
    expect(inventory.ignored).toBeUndefined();
    expect(inventory.created_at).toBeDefined();
  });

  it("serializes a new inventory including created_at", () => {
    const inventory = new Inventory({
      plot_id: "Plot 1",
      location: "Zaragoza"
    });

    const data = inventory.parseIdb();

    expect(data).toMatchObject({
      plot_id: "Plot 1",
      location: "Zaragoza"
    });
    expect(data.created_at).toBe(inventory.created_at);
    expect(data.id).toBeUndefined();
  });

  it("preserves created_at when serializing an existing inventory", () => {
    const createdAt = "2025-03-04T12:00:00.000Z";
    const inventory = new Inventory(
      {
        plot_id: "Plot 1",
        location: "Zaragoza",
        created_at: createdAt
      },
      7
    );

    const data = inventory.parseIdb();

    expect(data.id).toBe(7);
    expect(data.created_at).toBe(createdAt);
  });

  it("uses the configured display_col when rendering an inventory", () => {
    const inventory = new Inventory(
      { plot_id: "PLOT-42", location: "Zaragoza" },
      7
    );

    const element = inventory.toHtml();

    expect(element.textContent).toContain("PLOT-42");
  });

  it("throws and warns when no display_col is configured", () => {
    delete globalThis.inv_header.plot_id.display_col;

    const inventory = new Inventory({ plot_id: "PLOT-1" }, 1);

    expect(() => inventory.toHtml()).toThrow(/display_col/i);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it("throws and warns when more than one display_col is configured", () => {
    globalThis.inv_header.location.display_col = true;

    const inventory = new Inventory(
      { plot_id: "PLOT-1", location: "Zaragoza" },
      1
    );

    expect(() => inventory.toHtml()).toThrow(/display_col/i);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it("uses the display column to identify duplicates", async () => {
    const inventories = new Inventories();
    const createdAt = "2025-01-01T08:00:00.000Z";

    inventories.metadata = [
      new Inventory(
        {
          plot_id: "PLOT-1",
          location: "Old location",
          created_at: createdAt
        },
        10
      )
    ];

    const dbHandler = {
      addData: vi.fn(() => Promise.resolve())
    };

    const metadata = [
      { id: "inventory-plot_id", value: "PLOT-1" },
      { id: "inventory-location", value: "New location" },
      { id: "inventory-topography", value: "" }
    ];

    await inventories.save(metadata, dbHandler);

    expect(globalThis.confirm).toHaveBeenCalled();
    expect(dbHandler.addData).toHaveBeenCalledTimes(1);

    const [saved, store] = dbHandler.addData.mock.calls[0];
    expect(store).toBe("inventories");
    expect(saved.id).toBe(10);
    expect(saved.plot_id).toBe("PLOT-1");
    expect(saved.created_at).toBe(createdAt);
  });

  it("does not delete an inventory when confirmation is cancelled", async () => {
    globalThis.confirm.mockReturnValue(false);

    const inventory = new Inventory({ plot_id: "PLOT-9" }, 9);
    const dbHandler = {
      deleteRecord: vi.fn(() => Promise.resolve())
    };

    const deleted = await inventory.delete(dbHandler);

    expect(deleted).toBe(false);
    expect(dbHandler.deleteRecord).not.toHaveBeenCalled();
    expect(globalThis.confirm.mock.calls[0][0]).toContain("PLOT-9");
  });
});

describe("Inventories", () => {
  it("selects an inventory by id and by an arbitrary configured column", () => {
    const inventories = new Inventories();

    inventories.metadata = [
      new Inventory({ plot_id: "Plot A", location: "A" }, 1),
      new Inventory({ plot_id: "Plot B", location: "B" }, 2)
    ];

    expect(inventories.selectById(2).plot_id).toBe("Plot B");
    expect(inventories.selectByColumn("plot_id", "Plot A").location).toBe("A");
  });

  it("detects equal inventory properties", () => {
    const inventories = new Inventories();

    const current = new Inventory({
      plot_id: "Plot A",
      location: "A",
      topography: "flat"
    }, 1);

    const next = new Inventory({
      plot_id: "Plot A",
      location: "A",
      topography: "flat"
    });

    expect(inventories.checkProperties(next, current)).toBe(1);
  });

  it("stops the complete inventory deletion when confirmation is cancelled", async () => {
    globalThis.confirm.mockReturnValue(false);

    const inventories = new Inventories();
    inventories.metadata = [
      new Inventory({ plot_id: "PLOT-1", location: "A" }, 1)
    ];

    const dbHandler = {
      deleteRecord: vi.fn(() => Promise.resolve()),
      deleteRecords: vi.fn(() => Promise.resolve()),
      getRecords: vi.fn(() => Promise.resolve([]))
    };

    await inventories.delete(1, dbHandler);

    expect(dbHandler.deleteRecord).not.toHaveBeenCalled();
    expect(dbHandler.deleteRecords).not.toHaveBeenCalled();
    expect(dbHandler.getRecords).not.toHaveBeenCalled();
    expect(inventories.metadata).toHaveLength(1);
  });
});
