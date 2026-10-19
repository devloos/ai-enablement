import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { buildCardHtml, inlineBundle } from "./slack-card";

const REAL_BUNDLE = path.join(
  process.cwd(),
  "node_modules/@modelcontextprotocol/ext-apps/dist/src/app-with-deps.js"
);

test("turns the trailing export into a plain object", () => {
  const out = inlineBundle("var a=1;var b=2;export{a as App,b};");
  assert.equal(out, 'var a=1;var b=2;\nconst McpApps={"App":a,"b":b};');
});

test("throws if the bundle has no trailing export", () => {
  assert.throws(() => inlineBundle("var a=1;"), /Unexpected ext-apps bundle format/);
});

test("the real ext-apps bundle still exposes App after inlining", async () => {
  // Catches a library update that changes the bundle shape.
  const code = inlineBundle(await fs.readFile(REAL_BUNDLE, "utf-8")) + "\nexport default McpApps;";
  const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
  assert.equal(typeof mod.default.App, "function");
});

test("card calls only the approve tool and shows the channel", () => {
  const html = buildCardHtml("export{x as App};", "#ops");
  assert.match(html, /name: "approve_slack_message"/);
  assert.match(html, /#ops/);
  assert.doesNotMatch(html, /export\{/);
});
