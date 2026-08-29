/* EMI calculator — UI regressions.
 *
 * Every test here corresponds to a bug that actually shipped and was caught in review rather
 * than by me. The engine suite (scripts/test-emi.mjs) covers the maths; none of these would have
 * been caught there, because they live in rendering, event wiring, or CSS.
 */
import { test, expect } from "@playwright/test";

const URL = "/emi/index.html";

/** Wait for the calculator to settle: it coalesces updates into an animation frame. */
async function settle(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function setField(page, id, value) {
  await page.evaluate(([i, v]) => {
    const el = document.getElementById(i);
    el.value = v;
    el.dispatchEvent(new Event("change"));
  }, [id, value]);
  await settle(page);
}

const money = (s) => Number(String(s).replace(/[^0-9.]/g, "")) || 0;

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("favicon")) errors.push(m.text()); });
  page.__errors = errors;
  await page.goto(URL);
  await settle(page);
});

test.afterEach(async ({ page }) => {
  expect(page.__errors, "page threw or logged an error").toEqual([]);
});

test("loads and computes the default loan", async ({ page }) => {
  await expect(page.locator("#result-value")).toHaveText("₹22,493");
  await expect(page.locator("#st-interest")).toHaveText("₹28,98,356");
  await expect(page.locator("#st-total")).toHaveText("₹53,98,356");
});

test("totals reconcile with the schedule, including a capitalised holiday", async ({ page }) => {
  await page.locator("#adv").evaluate((el) => (el.open = true));
  await setField(page, "in-mora", "12");
  await setField(page, "mora-type", "full");

  // principal must be the sum borrowed, not the sum the schedule amortises
  await expect(page.locator("#st-principal")).toHaveText("₹25,00,000");

  const { total, sumPaid } = await page.evaluate(() => {
    const num = (s) => Number(String(s).replace(/[^0-9.]/g, "")) || 0;
    const heads = [...document.querySelectorAll("#sched thead th")].map((t) => t.textContent.trim());
    const col = heads.indexOf("Total Paid");
    const sum = [...document.querySelectorAll("#sched-body tr.yr-row")]
      .reduce((a, r) => a + num(r.children[col].textContent), 0);
    return { total: num(document.getElementById("st-total").textContent), sumPaid: sum };
  });
  expect(Math.abs(total - sumPaid)).toBeLessThan(200);
});

test("mode tabs are arrow-navigable and do not escape into bench chips", async ({ page }) => {
  // the chip's colour bar also carries .tab; an unscoped query used to select it and crash
  await page.locator("#btn-compare").click();
  await settle(page);
  expect(await page.locator(".chip .tab").count()).toBe(1);

  const tabs = page.locator("#mode-tabs .tab");
  await tabs.nth(3).focus();
  await page.keyboard.press("ArrowRight");
  await settle(page);
  await expect(page.locator("#mode-tabs .tab.on")).toHaveAttribute("data-mode", "emi");

  await page.keyboard.press("End");
  await settle(page);
  await expect(page.locator("#mode-tabs .tab.on")).toHaveAttribute("data-mode", "rate");
  await expect(page.locator("#result-value")).not.toHaveText("—");

  // roving tabindex: the group is a single tab stop
  const tabIndexes = await tabs.evaluateAll((els) => els.map((e) => e.tabIndex));
  expect(tabIndexes.filter((t) => t === 0)).toHaveLength(1);
});

test("scenario names cannot inject markup", async ({ page }) => {
  await page.locator("#btn-compare").click();
  await settle(page);
  // the rename field caps at 24 characters, so the payload has to fit inside that
  const payload = '"A" <img src=x onerr>';
  expect(payload.length).toBeLessThanOrEqual(24);
  await page.locator(".chip .ed").first().click();
  await page.locator(".nm-edit").fill(payload);
  await page.locator(".nm-edit").press("Enter");
  await settle(page);

  // nothing was parsed as markup, and the quotes did not break out of the aria-label
  expect(await page.locator(".bench img").count()).toBe(0);
  expect(await page.locator(".bench *").count()).toBe(await page.locator(".bench *").count());
  await expect(page.locator(".chip .nm").first()).toHaveText(payload);
  await expect(page.locator(".chip-main").first())
    .toHaveAttribute("aria-label", `Load ${payload} back into the calculator`);
});

test("an invalid input clears the tax rows instead of stranding stale relief", async ({ page }) => {
  await page.locator("#tax").evaluate((el) => (el.open = true));
  await setField(page, "tax-slab", "30");
  await expect(page.locator("#stat-tax")).toBeVisible();
  const before = await page.locator("#st-tax").textContent();
  expect(money(before)).toBeGreaterThan(0);

  await setField(page, "in-amount", "0");
  await expect(page.locator("#msg")).toBeVisible();
  await expect(page.locator("#stat-tax")).toBeHidden();
  await expect(page.locator("#stat-post")).toBeHidden();
});

test("a shared link in another currency clears the comparison", async ({ page }) => {
  await page.locator("#btn-compare").click();
  await setField(page, "in-rate", "8.4");
  await page.locator("#btn-compare").click();
  await settle(page);
  expect(await page.locator(".chip").count()).toBe(2);

  await page.evaluate(() => {
    location.hash = "md=emi&cu=USD&a=250000&r=9&t=240&tu=yr&e=2249&f=0&s=arrears&rt=reducing" +
      "&ym=cal&mm=0&mt=interest&x=0&ca=12&cf=0&pm=tenure&ir=0&ts=0&pt=self&tr=old&sd=2026-08";
  });
  await page.waitForTimeout(80);
  await settle(page);
  await expect(page.locator("#currency")).toHaveValue("USD");
  expect(await page.locator(".chip").count()).toBe(0);
});

test("a saved scenario is immune to later edits of the live loan", async ({ page }) => {
  await page.locator("#adv").evaluate((el) => (el.open = true));
  await page.locator("#add-lump").click();
  await settle(page);
  await page.locator("#btn-compare").click();
  await settle(page);
  const before = await page.locator("#matrix").innerText();

  await page.evaluate(() => {
    const a = document.querySelector(".lump-amt");
    a.value = "9,00,000";
    a.dispatchEvent(new Event("change"));
  });
  await settle(page);
  expect(await page.locator("#matrix").innerText()).toBe(before);
});

test("the matrix awards no badge when the best value is shared", async ({ page }) => {
  // two identical fee-free offers differing only in rate: fees tie, so neither may be crowned
  await page.locator("#btn-compare").click();
  await setField(page, "in-rate", "8.4");
  await page.locator("#btn-compare").click();
  await settle(page);

  const feesRow = page.locator("#matrix tbody tr").filter({ hasText: "Fees & charges" });
  expect(await feesRow.locator("td.best").count()).toBe(0);

  // and a genuinely unique winner still gets one
  const interestRow = page.locator("#matrix tbody tr").filter({ hasText: "Total interest" });
  expect(await interestRow.locator("td.best").count()).toBe(1);
});

test("a flat-rate offer is compared on its true APR, not its headline rate", async ({ page }) => {
  await page.locator("#btn-compare").click();                       // 9% reducing
  await page.locator('input[name="ratetype"][value="flat"]').click();
  await setField(page, "in-rate", "8");
  await setField(page, "in-tenure", "5");
  await page.locator("#btn-compare").click();
  await settle(page);

  const aprRow = page.locator("#matrix tbody tr").filter({ hasText: "APR incl. fees" });
  const cells = await aprRow.locator("td").allTextContents();
  const flatApr = money(cells[cells.length - 1]);
  expect(flatApr).toBeGreaterThan(13);     // ~14%, not 8%
  // the cheaper-APR reducing loan must hold the badge
  await expect(aprRow.locator("td.best")).toHaveCount(1);
  expect(await aprRow.locator("td.best").textContent()).toContain("9.00%");
});

test("share links round-trip the full state", async ({ page }) => {
  await page.locator("#adv").evaluate((el) => (el.open = true));
  await page.locator("#tax").evaluate((el) => (el.open = true));
  await setField(page, "in-rate", "8.37");
  await setField(page, "in-extra", "5000");
  await setField(page, "tax-regime", "new");
  await setField(page, "tax-slab", "25");
  await page.waitForTimeout(600);                 // the URL write is debounced
  const url = page.url();
  expect(url).toContain("ts=25");
  expect(url).toContain("tr=new");

  const expected = await page.locator("#result-value").textContent();
  await page.goto(url);
  await settle(page);
  await expect(page.locator("#result-value")).toHaveText(expected);
  await expect(page.locator("#in-rate")).toHaveValue("8.37");
  await expect(page.locator("#tax-slab")).toHaveValue("25");
});

test("tax slabs follow the regime", async ({ page }) => {
  await page.locator("#tax").evaluate((el) => (el.open = true));
  const values = () => page.locator("#tax-slab option").evaluateAll((o) => o.map((x) => x.value));

  await setField(page, "tax-regime", "old");
  expect(await values()).toEqual(["0", "5", "20", "30"]);

  await setField(page, "tax-regime", "new");
  expect(await values()).toEqual(["0", "5", "10", "15", "20", "25", "30"]);

  // a rate that only exists in the new regime must snap when switching back
  await setField(page, "tax-slab", "25");
  await setField(page, "tax-regime", "old");
  await expect(page.locator("#tax-slab")).toHaveValue("20");
});

test("the rate slider steps at 0.01 and defers the schedule during a drag", async ({ page }) => {
  await expect(page.locator("#sl-rate")).toHaveAttribute("step", "0.01");

  const firstInterest = () =>
    page.locator("#sched-body tr.yr-row").first().locator("td").nth(2).textContent();
  const before = await firstInterest();

  await page.evaluate(() => {
    const sl = document.getElementById("sl-rate");
    sl.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    sl.value = "14";
    sl.dispatchEvent(new Event("input"));
  });
  await settle(page);
  // headline tracks live, the heavy table waits for release
  await expect(page.locator("#result-value")).not.toHaveText("₹22,493");
  expect(await firstInterest()).toBe(before);

  await page.evaluate(() => {
    document.getElementById("sl-rate").dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  });
  await settle(page);
  expect(await firstInterest()).not.toBe(before);
});

test("hidden panels are actually hidden", async ({ page }) => {
  // a class with `display` outranks the UA [hidden] rule; this caught that once already
  await expect(page.locator("#bench-panel")).toBeHidden();
  await expect(page.locator("#savings")).toBeHidden();
  await page.locator("#btn-compare").click();
  await settle(page);
  await expect(page.locator("#bench-panel")).toBeVisible();
});

test("no horizontal page scroll", async ({ page }) => {
  await page.locator("#adv").evaluate((el) => (el.open = true));
  await page.locator("#tax").evaluate((el) => (el.open = true));
  await page.locator("#btn-compare").click();
  await settle(page);
  const { scrollW, clientW } = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  expect(scrollW).toBeLessThanOrEqual(clientW);
});

test("wide tables scroll inside their own container", async ({ page }) => {
  await page.locator("#btn-compare").click();
  await settle(page);
  for (const sel of [".table-panel .table-scroll", ".bench-panel .table-scroll"]) {
    const overflow = await page.locator(sel).first().evaluate((el) => getComputedStyle(el).overflowX);
    expect(["auto", "scroll"]).toContain(overflow);
  }
});

test.describe("touch", () => {
  test.skip(({ isMobile }) => !isMobile, "coarse-pointer sizing only");

  test("interactive controls meet the 44px minimum", async ({ page }) => {
    await page.locator("#adv").evaluate((el) => (el.open = true));
    await page.locator("#tax").evaluate((el) => (el.open = true));
    await page.locator("#btn-compare").click();
    await settle(page);

    const small = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll("button, select, summary, .info, input[type=month]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) return;
        const pb = getComputedStyle(el, "::before");
        const h = Math.max(r.height, parseFloat(pb.height) || 0);
        const w = Math.max(r.width, parseFloat(pb.width) || 0);
        if (h < 44 || w < 44) bad.push(`${el.id || el.className || el.tagName} ${Math.round(w)}x${Math.round(h)}`);
      });
      return bad;
    });
    expect(small).toEqual([]);
  });

  test("a money field is tappable across its whole box", async ({ page }) => {
    const box = page.locator("#in-amount").locator("xpath=..");
    expect((await box.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await box.click({ position: { x: 6, y: 6 } });          // the padding, not the text
    await expect(page.locator("#in-amount")).toBeFocused();
  });
});

test("the rename and remove hit areas do not overlap", async ({ page }) => {
  // both expand to 44px; at the old 25px spacing a tap near the rename button deleted the chip
  await page.locator("#btn-compare").click();
  await settle(page);
  const boxes = await page.evaluate(() => {
    const hit = (el) => {
      const r = el.getBoundingClientRect();
      const pb = getComputedStyle(el, "::before");
      const w = Math.max(r.width, parseFloat(pb.width) || 0);
      const cx = r.left + r.width / 2;
      return { left: cx - w / 2, right: cx + w / 2 };
    };
    return { ed: hit(document.querySelector(".chip .ed")), rm: hit(document.querySelector(".chip .rm")) };
  });
  expect(boxes.ed.right, "rename hit area runs into remove").toBeLessThanOrEqual(boxes.rm.left + 0.5);
});

test("clicking the rename control renames rather than removes", async ({ page }) => {
  await page.locator("#btn-compare").click();
  await settle(page);
  // aim at the right edge of the visible rename button, where the overlap used to bite.
  // A locator click scrolls the chip into view first; raw mouse coordinates miss below the fold.
  const ed = page.locator(".chip .ed").first();
  const box = await ed.boundingBox();
  await ed.click({ position: { x: box.width - 2, y: box.height / 2 } });
  await settle(page);
  expect(await page.locator(".nm-edit").count(), "should have opened the rename editor").toBe(1);
  expect(await page.locator(".chip").count(), "chip must not have been deleted").toBe(1);
});
