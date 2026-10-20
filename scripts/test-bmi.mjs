import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const directory = new URL('../public/tools/bmi/', import.meta.url);
const html = readFileSync(new URL('index.html', directory), 'utf8');
const core = html.match(/<script id="bmi-core">([\s\S]*?)<\/script>/)?.[1];
assert.ok(core);
const context = vm.createContext({});
vm.runInContext(`${core}\nglobalThis.core = BMI;`, context);
const { calculate, category, range, LB_KG } = context.core;

test('ships standalone with inline application code and the catalog theme', () => {
  assert.deepEqual(readdirSync(directory), ['index.html']);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
  assert.match(html, /site-theme-sync/);
  assert.match(html, /https:\/\/tools.soumendrak.com\/t\/bmi/);
  new vm.Script(html.match(/<script id="bmi-ui">([\s\S]*?)<\/script>/)[1]);
});

test('matches independent metric and CDC imperial examples', () => {
  assert.ok(Math.abs(calculate(170, 70).value - 24.221453287197235) < 1e-12);
  // CDC example: 5 ft 8 in, 200 lb gives BMI 30.4 to one decimal.
  const imperial = calculate(68 * 2.54, 200 * LB_KG);
  assert.equal(imperial.value.toFixed(1), '30.4');
  assert.equal(imperial.category.key, 'obesity');
});

test('classifies exact cutoffs and values that round across a boundary correctly', () => {
  for (const [bmi, key] of [[18.4999,'underweight'],[18.5,'healthy'],[24.9999,'healthy'],[25,'overweight'],[29.9999,'overweight'],[30,'obesity']]) {
    assert.equal(category(bmi).key,key);
    assert.equal(calculate(200,bmi * 4).category.key,key);
  }
});

test('rejects incomplete, non-finite, zero, negative and out-of-range measurements', () => {
  for (const height of [NaN,Infinity,-1,0,99.9,250.1,null,undefined]) assert.equal(calculate(height,70),null);
  for (const weight of [NaN,Infinity,-1,0,19.9,350.1,null,undefined]) assert.equal(calculate(170,weight),null);
  assert.ok(calculate(100,20));
  assert.ok(calculate(250,350));
});

test('reference endpoints stay inside the half-open interval in both unit systems', () => {
  for (let height = 100; height <= 250; height += .5) {
    const result = calculate(height,70);
    for (const unit of [1,LB_KG]) {
      const [low, high] = range(result.low / unit,result.high / unit);
      assert.ok(low * unit >= result.low - 1e-10);
      assert.ok(high * unit < result.high);
      assert.ok(low < high);
    }
  }
  assert.equal(range(74,100)[1],99.9);
});
