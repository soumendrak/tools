import { test, expect } from '@playwright/test';

const URL = '/bmi/index.html';
test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.__bmiErrors = errors;
  await page.goto(URL);
});
test.afterEach(async ({ page }) => expect(page.__bmiErrors).toEqual([]));

test('calculates live and clears every stale result on invalid input', async ({ page }) => {
  await expect(page.locator('#bmi-value')).toHaveText('24.22');
  await expect(page.locator('#bmi-category')).toHaveText('Healthy weight');
  await expect(page.locator('#weight-range')).toHaveText('53.5 – 72.2 kg');
  await page.locator('#height-cm').fill('200');
  await page.locator('#weight').fill('100');
  await expect(page.locator('#bmi-value')).toHaveText('25.00');
  await expect(page.locator('#bmi-category')).toHaveText('Overweight');
  await page.locator('#weight').fill('');
  await expect(page.locator('#weight')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#weight-error')).toBeVisible();
  await expect(page.locator('#bmi-value')).toHaveText('—');
  await expect(page.locator('#result-details')).toBeHidden();
  await expect(page.locator('[aria-current="true"]')).toHaveCount(0);
  // A slider remains usable to recover from an empty numeric input.
  await page.locator('#weight-slider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#bmi-value')).not.toHaveText('—');
});

test('converts units without drift and computes the CDC imperial example', async ({ page }) => {
  for (let i = 0; i < 6; i++) {
    await page.locator('#height-imperial').click();
    await page.locator('#weight-imperial').click();
    await expect(page.locator('#height-in')).toHaveValue('6.9');
    await expect(page.locator('#weight')).toHaveValue('154.3');
    await expect(page.locator('#bmi-value')).toHaveText('24.22');
    await page.locator('#height-metric').click();
    await page.locator('#weight-metric').click();
  }
  await expect(page.locator('#height-cm')).toHaveValue('170');
  await expect(page.locator('#weight')).toHaveValue('70');
  await page.locator('#height-cm').fill('182.8');
  await page.locator('#height-imperial').click();
  await page.locator('#weight-imperial').click();
  await expect(page.locator('#height-ft')).toHaveValue('6');
  await expect(page.locator('#height-in')).toHaveValue('0');
  await page.locator('#height-metric').click();
  await page.locator('#weight-metric').click();
  await expect(page.locator('#height-cm')).toHaveValue('182.8');
  await page.locator('#height-imperial').click();
  await page.locator('#weight-imperial').click();
  await page.getByLabel('Height in feet',{exact:true}).fill('5');
  await page.getByLabel('Additional inches',{exact:true}).fill('8');
  await page.locator('#weight').fill('200');
  await expect(page.locator('#bmi-value')).toHaveText('30.41');
  await expect(page.locator('#bmi-category')).toHaveText('Obesity');
  await page.getByLabel('Additional inches',{exact:true}).fill('12');
  await expect(page.locator('#height-error')).toBeVisible();
  await expect(page.locator('#result-details')).toBeHidden();
  await page.locator('#reset').click();
  await expect(page.locator('#height-metric')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#bmi-value')).toHaveText('24.22');
});

test('rejects invalid and extreme values and preserves unrounded categories', async ({ page }) => {
  await page.locator('#height-cm').fill('200');
  await page.locator('#weight').fill('99.9996');
  await expect(page.locator('#bmi-value')).toHaveText('25.00');
  await expect(page.locator('#bmi-category')).toHaveText('Healthy weight');
  for (const weight of ['0','-10','351']) {
    await page.locator('#weight').fill(weight);
    await expect(page.locator('#bmi-value')).toHaveText('—');
  }
  await page.locator('#weight').fill('70');
  await page.locator('#height-cm').fill('0');
  await expect(page.locator('#height-error')).toBeVisible();
  await page.locator('#height-imperial').click();
  await page.locator('#weight-imperial').click();
  await expect(page.locator('#bmi-value')).toHaveText('—');
});

test('uses the EMI fonts and palette, syncs themes and fits narrow screens', async ({ page }) => {
  for (const theme of ['light','dark']) {
    await page.evaluate(theme => window.postMessage({__theme:theme},location.origin),theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Space Grotesk');
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(theme === 'light' ? 'rgb(247, 240, 230)' : 'rgb(35, 28, 23)');
    await page.locator('#height-imperial').click();
    await page.locator('#weight-imperial').click();
    for (const width of [320,375,768,1280]) {
      await page.setViewportSize({width,height:900});
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.locator('#height-metric').click();
    await page.locator('#weight-metric').click();
  }
});


test('height and weight units are independent, including errors and reference ranges', async ({ page }) => {
  await page.getByRole('group', {name:'Height unit', exact:true}).getByRole('button', {name:'ft / in', exact:true}).click();
  await expect(page.locator('#weight')).toHaveValue('70');
  await expect(page.locator('#weight-unit')).toHaveText('kg');
  await page.getByLabel('Height in feet', {exact:true}).fill('5');
  await page.getByLabel('Additional inches', {exact:true}).fill('8');
  await expect(page.locator('#bmi-value')).toHaveText('23.46');
  await expect(page.locator('#weight-range')).toHaveText('55.2 – 74.5 kg');
  const heightBefore = await page.locator('#height-in').inputValue();
  await page.locator('#weight-imperial').click();
  await expect(page.locator('#height-in')).toHaveValue(heightBefore);
  await expect(page.locator('#bmi-value')).toHaveText('23.46');
  await expect(page.locator('#weight-range')).toHaveText('121.7 – 164.4 lb');
  await page.locator('#height-metric').click();
  await expect(page.locator('#weight-unit')).toHaveText('lb');
  await expect(page.locator('#weight')).toHaveValue('154.3');
  await expect(page.locator('#bmi-value')).toHaveText('23.46');
  await page.locator('#weight-metric').click();
  await expect(page.locator('#weight')).toHaveValue('70');
  // Changing the other unit selector must preserve an incomplete height entry.
  await page.locator('#height-imperial').click();
  await page.locator('#height-in').fill('');
  await page.locator('#weight-imperial').click();
  await expect(page.locator('#height-ft')).toHaveValue('5');
  await expect(page.locator('#height-in')).toHaveValue('');
  await expect(page.locator('#bmi-value')).toHaveText('—');
  await page.locator('#reset').click();
  await expect(page.locator('#height-metric')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#weight-metric')).toHaveAttribute('aria-pressed','true');
});
