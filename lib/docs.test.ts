import { test } from "node:test";
import assert from "node:assert/strict";
import { searchDocs } from "./docs";

test("finds the reorder rule", () => {
  const [top] = searchDocs("reorder threshold");
  assert.equal(top.id, "reorder-rule");
  assert.match(top.text, /below 30 units/);
});

test("finds the size curve for a sales drop question", () => {
  const ids = searchDocs("why did trail runner sales drop").map((r) => r.id);
  assert.equal(ids[0], "size-curve-trail-runner");
});

test("is case-insensitive", () => {
  assert.equal(searchDocs("RETURNS")[0].id, "returns-policy");
});

test("matches words in tags, not just text", () => {
  assert.equal(searchDocs("refund")[0].id, "returns-policy");
});

test("returns at most `limit` results", () => {
  assert.equal(searchDocs("restock inventory").length, 3);
  assert.equal(searchDocs("restock inventory", 1).length, 1);
});

test("returns nothing for unrelated or empty queries", () => {
  assert.deepEqual(searchDocs("kayak"), []);
  assert.deepEqual(searchDocs("   "), []);
  assert.deepEqual(searchDocs("the and what"), []);
});

test("ignores single letters but keeps sizes", () => {
  assert.deepEqual(searchDocs("m"), []);
  assert.ok(searchDocs("9.5").some((r) => r.id === "reorder-quantity"));
});

test("results only expose id, title, and text", () => {
  for (const r of searchDocs("approval")) {
    assert.deepEqual(Object.keys(r).sort(), ["id", "text", "title"]);
  }
});
