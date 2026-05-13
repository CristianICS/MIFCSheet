import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setupTests.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["MIFCSheet/**/*.js"],
      exclude: [
        "MIFCSheet/libs/**",
        "MIFCSheet/sw.js"
      ]
    }
  }
});