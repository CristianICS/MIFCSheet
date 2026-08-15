import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDBHandler } from "../MIFCSheet/classes.js";

describe("IndexedDBHandler", () => {
  let db;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  afterEach(() => {
    db?.db?.close();
  });

  it("initializes the expected object stores and indexes", async () => {
    db = await new IndexedDBHandler("test-db").init();

    expect(db.db.objectStoreNames.contains("rows")).toBe(true);
    expect(db.db.objectStoreNames.contains("inventories")).toBe(true);
    expect(db.db.objectStoreNames.contains("inventory_images")).toBe(true);
    expect(db.db.objectStoreNames.contains("row_images")).toBe(true);

    const tx = db.db.transaction(
      ["rows", "inventory_images", "row_images"],
      "readonly"
    );

    expect(
      tx.objectStore("rows").indexNames.contains("inventories_id")
    ).toBe(true);

    expect(
      tx.objectStore("inventory_images").indexNames.contains("inventories_id")
    ).toBe(true);

    expect(
      tx.objectStore("row_images").indexNames.contains("rows_id")
    ).toBe(true);

    expect(
      tx.objectStore("row_images").indexNames.contains("inventories_id")
    ).toBe(true);
  });

  it("adds and retrieves inventory records", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await db.addData(
      {
        plot_id: "Plot 1",
        location: "Zaragoza"
      },
      "inventories"
    );

    const records = await db.getAllData("inventories");

    expect(records).toHaveLength(1);
    expect(records[0].plot_id).toBe("Plot 1");
  });

  it("gets records by indexed inventory id", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await db.addData(
      { inventories_id: 10, species: "Pinus" },
      "rows"
    );

    await db.addData(
      { inventories_id: 20, species: "Quercus" },
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

  it("deletes a single record", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await db.addData(
      { id: 1, plot_id: "Plot 1" },
      "inventories"
    );

    await db.deleteRecord(1, "inventories");

    expect(await db.getAllData("inventories")).toHaveLength(0);
  });

  it("deletes every record matching an index value", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await db.addData(
      { rows_id: 7, inventories_id: 1, src: "a" },
      "row_images"
    );
    await db.addData(
      { rows_id: 7, inventories_id: 1, src: "b" },
      "row_images"
    );
    await db.addData(
      { rows_id: 8, inventories_id: 1, src: "c" },
      "row_images"
    );

    await db.deleteRecords(7, "rows_id", "row_images");

    const remaining = await db.getAllData("row_images");

    expect(remaining).toHaveLength(1);
    expect(remaining[0].rows_id).toBe(8);
  });

  it("rejects addData when the object store does not exist", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await expect(
      db.addData({ value: 1 }, "missing_store")
    ).rejects.toBeTruthy();
  });

  it("rejects deleteRecord failures instead of hanging silently", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await expect(
      Promise.resolve().then(() => db.deleteRecord(1, "missing_store"))
    ).rejects.toBeTruthy();
  });

  it("rejects getRecord failures instead of hanging silently", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await expect(
      Promise.resolve().then(() => db.getRecord(1, "missing_store"))
    ).rejects.toBeTruthy();
  });

  it("rejects getRecords failures instead of hanging silently", async () => {
    db = await new IndexedDBHandler("test-db").init();

    await expect(
      Promise.resolve().then(() =>
        db.getRecords(1, "missing_index", "rows")
      )
    ).rejects.toBeTruthy();
  });
});
