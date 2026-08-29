import { defineConfig, devices } from "@playwright/test";

/* UI tests for the vendored tools. The engine has its own Node suite (scripts/test-emi.mjs);
   this covers the layer that suite cannot reach — rendering, event wiring, URL state, and the
   CSS-dependent behaviour (hidden elements, touch targets, overflow) that only a real browser
   can answer. Two projects, because several past bugs only appeared on one pointer type. */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "line" : "list",
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1 --directory public/tools",
    url: "http://127.0.0.1:4173/emi/index.html",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    // hasTouch flips `pointer: coarse`, which is what gates the 44px sizing rules
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 800 } } },
  ],
});
