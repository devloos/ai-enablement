import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeInventory, toSearchQuery } from "./shopify";

test("keeps normal product names", () => {
  assert.equal(toSearchQuery("Trail Runner"), "Trail Runner");
  assert.equal(toSearchQuery("size 10.5"), "size 10.5");
});

test("strips Shopify search syntax", () => {
  assert.equal(toSearchQuery('status:draft OR (title:"*")'), "status draft OR title");
});

test("collapses whitespace and trims", () => {
  assert.equal(toSearchQuery("  trail   runner \n"), "trail runner");
});

test("returns empty string when nothing searchable is left", () => {
  assert.equal(toSearchQuery(':"()*'), "");
});

test("summarizes stock by size", () => {
  const summary = summarizeInventory({
    title: "Trail Runner",
    totalInventory: 42,
    variants: {
      nodes: [
        { title: "9.5", sku: "TR-095", inventoryQuantity: 18 },
        { title: "10.5", sku: "TR-105", inventoryQuantity: 24 },
        { title: "12", sku: null, inventoryQuantity: null },
      ],
    },
  });
  assert.deepEqual(summary, {
    product: "Trail Runner",
    totalInventory: 42,
    inventoryBySize: { "9.5": 18, "10.5": 24, "12": 0 },
  });
});
