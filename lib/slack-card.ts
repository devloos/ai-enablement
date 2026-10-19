import fs from "node:fs/promises";
import path from "node:path";

// The card is one HTML file. Hosts render it in a sandboxed iframe with no network access,
// so the MCP Apps browser library has to be inlined, not loaded from a CDN.
export const CARD_URI = "ui://slack-approval/card.html";

const BUNDLE_PATH = path.join(
  process.cwd(),
  "node_modules/@modelcontextprotocol/ext-apps/dist/src/app-with-deps.js"
);

/**
 * The bundle is an ES module ending in `export{a as App,...}`.
 * Inline scripts can't import from it, so turn that export into a plain object.
 */
export function inlineBundle(bundle: string) {
  const match = bundle.match(/export\s*\{([^}]*)\};?\s*$/);
  if (!match) throw new Error("Unexpected ext-apps bundle format");
  const entries = match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [local, exported = local] = part.split(/\s+as\s+/);
      return `${JSON.stringify(exported)}:${local}`;
    });
  return `${bundle.slice(0, match.index)}\nconst McpApps={${entries.join(",")}};`;
}

export function buildCardHtml(bundle: string, channelName: string) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
  body { margin: 0; padding: 16px; }
  .card { border: 1px solid #8884; border-radius: 12px; padding: 16px; max-width: 520px; }
  h2 { margin: 0 0 4px; font-size: 16px; }
  .channel { opacity: 0.7; font-size: 13px; margin-bottom: 12px; }
  textarea { width: 100%; box-sizing: border-box; min-height: 110px; font: inherit; padding: 8px;
             border-radius: 8px; border: 1px solid #8886; background: transparent; color: inherit; }
  .row { display: flex; gap: 8px; margin-top: 12px; align-items: center; }
  button { font: inherit; padding: 6px 14px; border-radius: 8px; border: 1px solid #8886; cursor: pointer; }
  button.primary { background: #2f6f4f; color: white; border-color: #2f6f4f; }
  button:disabled { opacity: 0.5; cursor: default; }
  #status { font-size: 13px; }
</style>
</head>
<body>
<div class="card">
  <h2>Proposed Slack message</h2>
  <div class="channel">${channelName} · edit before approving</div>
  <textarea id="text" maxlength="2000" placeholder="Waiting for draft..."></textarea>
  <div class="row">
    <button id="approve" class="primary" disabled>Approve &amp; post</button>
    <button id="deny" disabled>Deny</button>
    <span id="status"></span>
  </div>
</div>
<script type="module">
${inlineBundle(bundle)}

const textEl = document.getElementById("text");
const approveBtn = document.getElementById("approve");
const denyBtn = document.getElementById("deny");
const statusEl = document.getElementById("status");

function setDraft(text) {
  if (typeof text !== "string") return;
  textEl.value = text;
  approveBtn.disabled = denyBtn.disabled = false;
}

function finish(message) {
  statusEl.textContent = message;
  textEl.readOnly = true;
  approveBtn.disabled = denyBtn.disabled = true;
}

const app = new McpApps.App({ name: "Slack Approval", version: "1.0.0" });

// Register handlers before connect; the host may send them right away.
// Tool input arrives first (the model's draft), then the tool result.
app.ontoolinput = (params) => setDraft(params.arguments?.text);
app.ontoolresult = (params) => setDraft(params.structuredContent?.text);

approveBtn.onclick = async () => {
  approveBtn.disabled = denyBtn.disabled = true;
  statusEl.textContent = "Posting...";
  try {
    // approve_slack_message is app-only: the model can't see or call it. Only this click can.
    const result = await app.callServerTool({
      name: "approve_slack_message",
      arguments: { text: textEl.value },
    });
    if (result.isError) throw new Error(result.content?.[0]?.text ?? "Post failed");
    finish("Posted ✓");
    // Tell the model what happened, so it doesn't offer to post again.
    await app.sendMessage({
      role: "user",
      content: [{ type: "text", text: "I approved the Slack message and it was posted." }],
    });
  } catch (err) {
    statusEl.textContent = String(err.message ?? err);
    approveBtn.disabled = denyBtn.disabled = false;
  }
};

denyBtn.onclick = async () => {
  finish("Not posted");
  await app.sendMessage({
    role: "user",
    content: [{ type: "text", text: "I denied the Slack message. Do not post it." }],
  });
};

await app.connect();
</script>
</body>
</html>`;
}

let cached: string | undefined;

export async function loadCardHtml(channelName: string) {
  cached ??= buildCardHtml(await fs.readFile(BUNDLE_PATH, "utf-8"), channelName);
  return cached;
}
