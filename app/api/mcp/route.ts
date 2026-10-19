import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getToken } from "@vercel/connect";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { CARD_URI, loadCardHtml } from "@/lib/slack-card";
import { DOC_TITLES, searchDocs } from "@/lib/docs";
import { getSalesSummary, PRODUCT_TITLES } from "@/lib/sales";
import {
  INVENTORY_QUERY,
  shopifyGraphql,
  summarizeInventory,
  toSearchQuery,
  type InventoryProductNode,
} from "@/lib/shopify";

// The only channel this server may post to. Use the channel ID (Slack → channel details → bottom).
const ALLOWED_CHANNEL = "C0CB1DTSJUQ";
const CHANNEL_NAME = "#ops";

const handler = createMcpHandler((server) => {
  server.registerTool(
    "get_sales_summary",
    {
      title: "Get Sales Summary",
      description:
        "Get unit sales and revenue for a product: last 7 days vs the 7 days before, with a breakdown by size.",
      inputSchema: z.object({
        product: z.string().min(1).describe("Product name, e.g. 'trail runner'"),
      }),
    },
    async ({ product }) => {
      const data = getSalesSummary(product);
      if (!data) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Unknown product "${product}". Known products: ${PRODUCT_TITLES.join(", ")}`,
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    }
  );

  server.registerTool(
    "get_inventory",
    {
      title: "Get Inventory",
      description:
        "Get live stock from Shopify for products matching a name: total units and units by size.",
      inputSchema: z.object({
        product: z.string().min(1).describe("Product name, e.g. 'trail runner'"),
      }),
    },
    async ({ product }) => {
      const q = toSearchQuery(product);
      if (!q) {
        return {
          isError: true,
          content: [{ type: "text", text: "Product name has no searchable text." }],
        };
      }

      try {
        const data = await shopifyGraphql<{ products: { nodes: InventoryProductNode[] } }>(
          INVENTORY_QUERY,
          { q }
        );
        const results = data.products.nodes.map(summarizeInventory);
        if (results.length === 0) {
          return {
            isError: true,
            content: [{ type: "text", text: `No Shopify products match "${product}".` }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify({ results }) }],
        };
      } catch (err) {
        // Log the full error for you; give the model a short one.
        console.error("get_inventory failed", err);
        return {
          isError: true,
          content: [{ type: "text", text: "Could not reach Shopify. Try again later." }],
        };
      }
    }
  );

  server.registerTool(
    "search_company_docs",
    {
      title: "Search Company Docs",
      description:
        "Search company policy docs: reorder rules, core sizes, size curves, approvals, alerts, returns.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .max(200)
          .describe("Keywords to search for, e.g. 'reorder rule' or 'trail runner sizes'"),
      }),
    },
    async ({ query }) => {
      const results = searchDocs(query);
      if (results.length === 0) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No docs match "${query}". Available docs: ${DOC_TITLES.join(", ")}`,
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ query, results }) }],
      };
    }
  );

  // Step 1 of 2: the model drafts. Nothing is posted; Claude shows the approval card instead.
  registerAppTool(
    server,
    "draft_slack_message",
    {
      title: "Draft Slack Message",
      description:
        "Draft a short message for the team's #ops Slack channel. Shows the user an approval card; " +
        "nothing is posted until they approve it there. Use only when the user asks to share something.",
      inputSchema: z.object({
        text: z.string().min(1).max(2000).describe("The message to propose"),
      }),
      annotations: { readOnlyHint: true },
      _meta: { ui: { resourceUri: CARD_URI } },
    },
    async ({ text }) => ({
      content: [
        {
          type: "text",
          text: "Draft shown to the user in an approval card. Nothing has been posted. Wait for the user to approve or deny it.",
        },
      ],
      // The card reads this. The draft lives in the card, so the server stores nothing.
      structuredContent: { text, channel: CHANNEL_NAME },
    })
  );

  // Step 2 of 2: app-only. Hidden from the model, so only a click in the card can post.
  registerAppTool(
    server,
    "approve_slack_message",
    {
      title: "Approve Slack Message",
      description: "Post an approved message to #ops. Called by the approval card only.",
      inputSchema: z.object({
        text: z.string().min(1).max(2000),
      }),
      annotations: { readOnlyHint: false, openWorldHint: true },
      _meta: { ui: { resourceUri: CARD_URI, visibility: ["app"] } },
    },
    async ({ text }) => {
      const token = await getToken("slack/brandops-slack", {
        subject: { type: "app" },
        scopes: ["chat:write"],
      });

      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: ALLOWED_CHANNEL, text }),
      });
      const data = await res.json();

      // Slack returns HTTP 200 even on failure. Check `ok`.
      if (!data.ok) {
        return {
          isError: true,
          content: [{ type: "text", text: `Slack error: ${data.error}` }],
        };
      }
      return {
        content: [{ type: "text", text: `Posted to Slack (ts ${data.ts})` }],
      };
    }
  );

  // The card's HTML. Claude fetches this when draft_slack_message runs.
  registerAppResource(
    server,
    "Slack approval card",
    CARD_URI,
    { description: "Approve, edit, or deny a proposed Slack message." },
    async () => ({
      contents: [
        { uri: CARD_URI, mimeType: RESOURCE_MIME_TYPE, text: await loadCardHtml(CHANNEL_NAME) },
      ],
    })
  );
});

export { handler as GET, handler as POST };
