import { describe, it, expect, beforeEach, vi } from "vitest";
import { Inventory, Inventories } from "../MIFCSheet/classes.js";

describe("Inventory", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
  });

  it("creates an inventory from configured metadata", () => {
    const inventory = new Inventory({
      name: "Plot 1",
      location: "Zaragoza",
      ignored: "not stored"
    });

    expect(inventory.name).toBe("Plot 1");
    expect(inventory.location).toBe("Zaragoza");
    expect(inventory.ignored).toBeUndefined();
    expect(inventory.created_at).toBeDefined();
  });

  it("serializes new inventory for IndexedDB", () => {
    const inventory = new Inventory({
      name: "Plot 1",
      location: "Zaragoza"
    });

    const data = inventory.parseIdb();

    expect(data).toMatchObject({
      name: "Plot 1",
      location: "Zaragoza"
    });
    expect(data.created_at).toBeDefined();
    expect(data.id).toBeUndefined();
  });

  it("serializes existing inventory with id", () => {
    const inventory = new Inventory(
      { name: "Plot 1", location: "Zaragoza" },
      7
    );

    const data = inventory.parseIdb();

    expect(data.id).toBe(7);
    expect(data.created_at).toBeUndefined();
  });
});

describe("Inventories", () => {
  it("selects inventory by id and name", () => {
    const inventories = new Inventories();

    inventories.metadata = [
      new Inventory({ name: "Plot A", location: "A" }, 1),
      new Inventory({ name: "Plot B", location: "B" }, 2)
    ];

    expect(inventories.selectById(2).name).toBe("Plot B");
    expect(inventories.selectByName("Plot A").location).toBe("A");
  });

  it("detects equal inventory properties", () => {
    const inventories = new Inventories();

    const current = new Inventory({ name: "Plot A", location: "A" }, 1);
    const next = new Inventory({ name: "Plot A", location: "A" });

    expect(inventories.checkProperties(next, current)).toBe(1);
  });
});