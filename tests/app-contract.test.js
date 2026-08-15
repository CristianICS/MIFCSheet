import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "MIFCSheet", "app.js");
const appSource = readFileSync(appPath, "utf8");

describe("app.js reliability contracts", () => {
  it("awaits saving all rows before reading them back", () => {
    expect(appSource).toMatch(
      /await\s+rows\.save\s*\(\s*inventories\.activeid\s*,\s*dbHandler\s*\)/
    );

    const saveIndex = appSource.search(/await\s+rows\.save/);
    const initIndex = appSource.search(/await\s+rows\.init/);

    expect(saveIndex).toBeGreaterThanOrEqual(0);
    expect(initIndex).toBeGreaterThan(saveIndex);
  });

  it("awaits pending image writes", () => {
    expect(appSource).toMatch(/await\s+images\.save\s*\(/);
  });

  it("clears pending images when exiting an open inventory", () => {
    expect(appSource).toMatch(/images\.clearPending\s*\(\s*\)/);
  });
});