import { describe, it, expect, beforeEach } from "vitest";
import { indexedDB } from "fake-indexeddb";
import { IndexedDBHandler } from "../MIFCSheet/classes.js";

describe("IndexedDBHandler", () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase("test-db");
  });

  it("initializes the expected object stores", async () => {
    const db = await new IndexedDBHandler("test-db").init();

    expect(db.db.objectStoreNames.contains("rows")).toBe(true);
    expect(db.db.objectStoreNames.contains("inventories")).toBe(true);
    expect(db.db.objectStoreNames.contains("inventory_images")).toBe(true);
    expect(db.db.objectStoreNames.contains("row_images")).toBe(true);
  });

  it("adds and retrieves inventory records", async () => {
    const db = await new IndexedDBHandler("test-db").init();

    await db.addData({ name: "Plot 1", location: "Zaragoza" }, "inventories");

    const records = await db.getAllData("inventories");

    expect(records).toHaveLength(1);
    expect(records[0].name).toBe("Plot 1");
  });

  it("gets records by indexed inventory id", async () => {
    const db = await new IndexedDBHandler("test-db").init();

    await db.addData({ inventories_id: 10, species: "Pinus" }, "rows");
    await db.addData({ inventories_id: 20, species: "Quercus" }, "rows");

    const records = await db.getRecords(10, "inventories_id", "rows");

    expect(records).toHaveLength(1);
    expect(records[0].species).toBe("Pinus");
  });

  it("deletes a record", async () => {
    const db = await new IndexedDBHandler("test-db").init();

    await db.addData({ id: 1, name: "Plot 1" }, "inventories");
    await db.deleteRecord(1, "inventories");

    const records = await db.getAllData("inventories");

    expect(records).toHaveLength(0);
  });
});