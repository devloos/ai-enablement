import { test } from "node:test";
import assert from "node:assert/strict";
import { getSalesSummary, PRODUCT_TITLES } from "./sales";

test("finds a product case-insensitively", () => {
  const s = getSalesSummary("  trail RUNNER ");
  assert.equal(s?.product, "Trail Runner");
});

test("matches a partial name", () => {
  assert.equal(getSalesSummary("fleece")?.product, "Ridgeline Fleece");
});

test("computes revenue and change percent", () => {
  const s = getSalesSummary("Trail Runner");
  assert.deepEqual(s?.thisWeek, { units: 312, revenue: 43680 });
  assert.deepEqual(s?.lastWeek, { units: 416, revenue: 58240 });
  assert.equal(s?.changePercent, -25);
});

test("rounds change percent to one decimal", () => {
  // Summit Shell: 58 vs 49 → +18.37%
  assert.equal(getSalesSummary("summit")?.changePercent, 18.4);
});

test("returns null for unknown or empty products", () => {
  assert.equal(getSalesSummary("kayak"), null);
  assert.equal(getSalesSummary("   "), null);
});

test("size breakdowns add up to the weekly totals", () => {
  for (const title of PRODUCT_TITLES) {
    const s = getSalesSummary(title)!;
    const sum = (sizes: Record<string, number>) =>
      Object.values(sizes).reduce((a, b) => a + b, 0);
    assert.equal(sum(s.unitsBySize.thisWeek), s.thisWeek.units, `${title} this week`);
    assert.equal(sum(s.unitsBySize.lastWeek), s.lastWeek.units, `${title} last week`);
  }
});
