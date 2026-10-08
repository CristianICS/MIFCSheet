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

  it("asks once about out-of-range values before saving anything", () => {
    const confirmIndex = appSource.search(
      /if\s*\(\s*outOfRange\.length\s*>\s*0\s*&&\s*!confirm\s*\(\s*outOfRangeMessage\s*\(/
    );
    const saveIndex = appSource.search(/await\s+inventories\.save/);

    expect(confirmIndex).toBeGreaterThanOrEqual(0);
    expect(saveIndex).toBeGreaterThan(confirmIndex);
  });

  it("clears pending images when exiting an open inventory", () => {
    expect(appSource).toMatch(/images\.clearPending\s*\(\s*\)/);
  });

  it("previews the form rows, including unsaved edits", () => {
    const caseIndex = appSource.search(/case\s+'preview':\s*\/\/\s*Preview the transect, including/);
    const collectIndex = appSource.indexOf("rows.collect()", caseIndex);
    const openIndex = appSource.indexOf("openPreview(", caseIndex);

    expect(caseIndex).toBeGreaterThanOrEqual(0);
    expect(collectIndex).toBeGreaterThan(caseIndex);
    expect(openIndex).toBeGreaterThan(collectIndex);
  });

  it("previews saved inventories from IndexedDB", () => {
    const caseIndex = appSource.search(/case\s+'preview':\s*\/\/\s*Preview the saved transect/);
    const initIndex = appSource.search(/await\s+savedRows\.init\s*\(\s*id\s*,\s*dbHandler\s*\)/);
    const openIndex = appSource.indexOf("openPreview(", caseIndex);

    expect(caseIndex).toBeGreaterThanOrEqual(0);
    expect(initIndex).toBeGreaterThan(caseIndex);
    expect(openIndex).toBeGreaterThan(initIndex);
  });

  it("opens the saved inventory before highlighting a tapped warning", () => {
    const caseIndex = appSource.search(/case\s+'preview':\s*\/\/\s*Preview the saved transect/);
    const callback = appSource.slice(caseIndex).match(
      /onWarning:\s*async\s*\(\s*rown\s*,\s*key\s*\)\s*=>\s*\{([\s\S]*?)\}/
    );

    expect(callback).not.toBeNull();
    const body = callback[1];
    expect(body).toMatch(/await\s+openInventory\s*\(\s*id\s*\)/);
    expect(body.search(/highlightRow\s*\(/)).toBeGreaterThan(body.search(/openInventory/));
  });

  it("adds the preview button at startup", () => {
    expect(appSource).toMatch(/^initPreviewButton\s*\(\s*\)\s*;/m);
  });
});