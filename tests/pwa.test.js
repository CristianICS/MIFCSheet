import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const swPath = resolve(process.cwd(), "MIFCSheet", "sw.js");
const manifestPath = resolve(process.cwd(), "MIFCSheet", "manifest.json");
const indexPath = resolve(process.cwd(), "MIFCSheet", "index.html");

const swSource = readFileSync(swPath, "utf8");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const indexSource = readFileSync(indexPath, "utf8");

describe("PWA update and deployment configuration", () => {
  it("uses a versioned cache", () => {
    expect(swSource).toMatch(
      /const\s+VERSION\s*=\s*["']v\d+["']/
    );
    expect(swSource).toContain("CACHE_NAME");
  });

  it("activates a newly installed worker immediately", () => {
    expect(swSource).toMatch(/skipWaiting\s*\(/);
    expect(swSource).toMatch(/clients\.claim\s*\(/);
  });

  it("builds cached resource URLs relative to the service-worker scope", () => {
    expect(swSource).toContain("self.registration.scope");
    expect(swSource).toMatch(/new\s+URL\s*\(/);
  });

  it("does not use domain-root paths for core cached application files", () => {
    expect(swSource).not.toMatch(
      /["']\/(?:app\.js|classes\.js|index\.html|species\.csv|style\.css)["']/
    );
  });

  it("uses a scope-relative navigation fallback", () => {
    expect(swSource).toMatch(
      /new\s+URL\s*\(\s*["']["']\s*,\s*self\.registration\.scope\s*\)/
    );
  });

  it("uses a relative PWA start URL", () => {
    expect(manifest.start_url).toBe("./");
  });

  it("bypasses the HTTP cache when checking the service worker", () => {
    expect(indexSource).toMatch(
      /updateViaCache\s*:\s*["']none["']/
    );
  });

  it("does not manually call registration.update()", () => {
    expect(indexSource).not.toMatch(
      /registration\.update\s*\(/
    );
  });
});