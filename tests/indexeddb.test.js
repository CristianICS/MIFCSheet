import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDBHandler } from "../MIFCSheet/classes.js";

describe("IndexedDBHandler", () => {
  let db;

  beforeEach(() => {
    // Completely new in-memory IndexedDB for every test
    globalThis.indexedDB = new IDBFactory();
  });

  afterEach(() => {
    // Close the connection created by IndexedDBHandler
    db?.db?.close();
  });

  it("initializes the expected object stores", async () => {
    db = await new IndexedDBHandler("test-db").init();

    expect(db.db.objectStoreNames.contains("rows")).toBe(true);
    expect(db.db.objectStoreNames.contains("inventories")).toBe(true);
    expect(db.db.objectStoreNames.contains("inventory_images")).toBe(true);
    expect(db.db.objectStoreNames.contains("row_images")).toBe(true);
  });

  it("adds and retrieves inventory records", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await db.addData(
      {
        name: "Plot 1",
        location: "Zaragoza",
      },
      "inventories"
    );

    const records = await db.getAllData("inventories");

    expect(records).toHaveLength(1);
    expect(records[0].name).toBe("Plot 1");
  });

  it("gets records by indexed inventory id", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await db.addData(
      {
        inventories_id: 10,
        species: "Pinus",
      },
      "rows"
    );

    await db.addData(
      {
        inventories_id: 20,
        species: "Quercus",
      },
      "rows"
    );

    const records = await db.getRecords(
      10,
      "inventories_id",
      "rows"
    );

    expect(records).toHaveLength(1);
    expect(records[0].species).toBe("Pinus");
  });

  it("deletes a record", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await db.addData(
      {
        id: 1,
        name: "Plot 1",
      },
      "inventories"
    );

    await db.deleteRecord(1, "inventories");

    const records = await db.getAllData("inventories");

    expect(records).toHaveLength(0);
  });
});