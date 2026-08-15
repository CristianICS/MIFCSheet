import { describe, it, expect, beforeEach, vi } from "vitest";
import { Images } from "../MIFCSheet/classes.js";

describe("Images", () => {
  let images;

  beforeEach(() => {
    images = new Images();
  });

  it("clears pending images explicitly", () => {
    images.content = [
      { uid: 1, type: "inventory" },
      { uid: 2, type: "row" }
    ];

    images.clearPending();

    expect(images.content).toEqual([]);
  });

  it("rejects a row image when its saved row cannot be found", async () => {
    images.content = [{
      uid: 1,
      id: "rown-3",
      inventories_id: 4,
      src: "data:image/png;base64,AA==",
      extension: "png",
      type: "row"
    }];

    const dbHandler = {
      addData: vi.fn(() => Promise.resolve())
    };

    await expect(
      images.save(dbHandler, [{ rown: 2, id: 20 }])
    ).rejects.toThrow(/row 3/i);

    expect(dbHandler.addData).not.toHaveBeenCalled();
    expect(images.content).toHaveLength(1);
  });

  it("waits for an image write before removing it from the pending queue", async () => {
    images.content = [{
      uid: 1,
      id: "rown-3",
      inventories_id: 4,
      src: "data:image/png;base64,AA==",
      extension: "png",
      type: "row"
    }];

    let resolveWrite;
    const writePromise = new Promise((resolve) => {
      resolveWrite = resolve;
    });

    const dbHandler = {
      addData: vi.fn(() => writePromise)
    };

    const savePromise = images.save(
      dbHandler,
      [{ rown: 3, id: 30 }]
    );

    await Promise.resolve();

    expect(images.content).toHaveLength(1);
    expect(dbHandler.addData).toHaveBeenCalledTimes(1);

    const [saved, store] = dbHandler.addData.mock.calls[0];
    expect(store).toBe("row_images");
    expect(saved.rows_id).toBe(30);

    resolveWrite();
    await savePromise;

    expect(images.content).toHaveLength(0);
  });

  it("keeps the failed image and all later images pending", async () => {
    images.content = [
      {
        uid: 1,
        id: 4,
        src: "data:image/png;base64,AA==",
        extension: "png",
        type: "inventory"
      },
      {
        uid: 2,
        id: 4,
        src: "data:image/png;base64,BB==",
        extension: "png",
        type: "inventory"
      }
    ];

    const dbHandler = {
      addData: vi.fn(() => Promise.reject(new Error("storage failed")))
    };

    await expect(
      images.save(dbHandler)
    ).rejects.toThrow("storage failed");

    expect(images.content).toHaveLength(2);
  });

  it("removes only images whose writes have succeeded", async () => {
    images.content = [
      {
        uid: 1,
        id: 4,
        src: "data:image/png;base64,AA==",
        extension: "png",
        type: "inventory"
      },
      {
        uid: 2,
        id: 4,
        src: "data:image/png;base64,BB==",
        extension: "png",
        type: "inventory"
      }
    ];

    const dbHandler = {
      addData: vi.fn()
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error("second write failed"))
    };

    await expect(
      images.save(dbHandler)
    ).rejects.toThrow("second write failed");

    expect(images.content).toHaveLength(1);
    expect(images.content[0].uid).toBe(2);
  });
});
