/* Smoke tests across every vendored tool.
 *
 * These are deliberately generic. Writing behavioural tests for 46 hand-written tools is a much
 * larger job, but the invariants below apply to all of them and are exactly what breaks when a
 * tool is re-synced from upstream or when the shared theme skin changes:
 *
 *   - the page loads and its script runs without throwing
 *   - it does not scroll sideways on a phone
 *   - the injected theme skin actually themes it, in both light and dark
 *   - it has a title and the canonical link back to its /t/<slug> page
 *
 * Tools with real logic get their own targeted tests in tools-logic.spec.js.
 */
import { test, expect } from "@playwright/test";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// Playwright runs from the config's directory, so this resolves against the repo root
const ROOT = join(process.cwd(), "public", "tools");
const SLUGS = readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(ROOT, d.name, "index.html")))
  .map((d) => d.name)
  .sort();

/* Tools that currently scroll sideways on a 375px phone. These are real usability bugs, not
 * design choices — recorded as a ratchet rather than a skip: each entry is the widest the tool
 * is allowed to be, so it can never get worse, and the other 40 must not overflow at all.
 * Lower a number as a tool is fixed, and delete the entry when it reaches the viewport width.
 */
const MOBILE_OVERFLOW_BUDGET = {
  "writing-scheduler": 621,
  "portfolio-tracker": 550,
  mandelbrot: 539,
  "citation-manager": 510,
  "config-diff": 429,
  "coolify-dashboard-widget": 404,
  "sip-calculator": 391,
};

/* Tools that hardcode a dark background instead of using var(--bg), so they stay dark even when
 * the site is in light mode. The skin reaches them — `--bg` flips correctly — they just never
 * read it. For orbital-sim and analog-clock a fixed dark canvas is arguably intentional; for
 * dayleft and yaml-validator it looks like an oversight, since a near-black panel sits oddly
 * inside a cream page.
 *
 * Listed rather than deleted from the suite so the count cannot quietly grow: any NEW tool that
 * ignores the theme fails. Remove a slug from here once it reads var(--bg) and the assertion
 * below starts protecting it.
 */
const IGNORES_SITE_THEME = new Set(["analog-clock", "dayleft", "orbital-sim", "yaml-validator"]);

test("the catalog is not empty", () => {
  expect(SLUGS.length).toBeGreaterThan(40);
});

for (const slug of SLUGS) {
  test.describe(slug, () => {
    test("loads, themes, and fits the viewport", async ({ page, isMobile }) => {
      const errors = [];
      page.on("pageerror", (e) => errors.push(`threw: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const t = m.text();
        // favicons and third-party fetches are not the tool's fault
        if (/favicon|net::ERR|Failed to load resource/i.test(t)) return;
        errors.push(`console: ${t}`);
      });

      const res = await page.goto(`/${slug}/index.html`);
      expect(res.status(), "page should serve").toBe(200);
      await page.waitForLoadState("domcontentloaded");
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

      // 1. it ran without throwing
      expect(errors, `${slug} logged errors`).toEqual([]);

      // 2. it says what it is
      expect((await page.title()).trim().length, "needs a <title>").toBeGreaterThan(0);

      // 3. the skin injected a canonical back to the descriptive page
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, "skin should inject a canonical").toContain(`/t/${slug}`);

      // 4. it does not scroll sideways
      const { scrollW, clientW } = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      const budget = isMobile ? MOBILE_OVERFLOW_BUDGET[slug] : undefined;
      if (budget) {
        expect(scrollW, `${slug} got wider than its recorded ${budget}px budget`)
          .toBeLessThanOrEqual(budget);
        // and tell us when it has actually been fixed, so the entry can be removed
        expect(scrollW, `${slug} no longer overflows — drop it from MOBILE_OVERFLOW_BUDGET`)
          .toBeGreaterThan(clientW + 1);
      } else {
        expect(scrollW, `${slug} scrolls horizontally at ${clientW}px`).toBeLessThanOrEqual(clientW + 1);
      }

      // 5. the theme actually applies: the body paints, and dark mode is genuinely darker
      if (!isMobile) {
        const luminance = async (theme) => {
          await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
          return page.evaluate(() => {
            const bg = getComputedStyle(document.body).backgroundColor;
            const m = bg.match(/\d+/g);
            if (!m) return null;
            if (m.length > 3 && Number(m[3]) === 0) return null;      // transparent body
            const [r, g, b] = m.map(Number);
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          });
        };
        const light = await luminance("light");
        const dark = await luminance("dark");
        // whatever else, the body must paint something — a transparent body shows the host page
        expect(light, `${slug} has a transparent body background`).not.toBeNull();
        expect(dark, `${slug} has a transparent body background in dark mode`).not.toBeNull();

        if (IGNORES_SITE_THEME.has(slug)) {
          // pinned so the exception cannot silently spread; delete the slug once it is fixed
          expect(dark, `${slug} now follows the theme — remove it from IGNORES_SITE_THEME`)
            .toBeCloseTo(light, 5);
        } else {
          expect(dark, `${slug} does not go darker in dark mode`).toBeLessThan(light);
        }
      }
    });
  });
}
