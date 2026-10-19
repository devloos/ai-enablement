import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getToken } from "@vercel/connect";
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

  server.registerTool(
    "post_slack_message",
    {
      title: "Post Slack Message",
      description:
        "Post a short message to the team's #ops Slack channel. Use only when the user asks to share something.",
      inputSchema: z.object({
        text: z.string().min(1).max(2000).describe("The message to post"),
      }),
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
});

export { handler as GET, handler as POST };
