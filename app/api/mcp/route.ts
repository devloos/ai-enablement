import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const handler = createMcpHandler((server) => {
  server.registerTool(
    "get_sales_summary",
    {
      title: "Get Sales Summary",
      description:
        "Get weekly unit sales for a product: this week vs last week",
      inputSchema: z.object({
        product: z.string().describe("Product name, e.g. 'trail runner'"),
      }),
    },
    async ({ product }) => {
      console.log(">>> MCP TOOL CALLED: get_sales_summary", product);
      const data = {
        product,
        thisWeek: 312,
        lastWeek: 416,
        changePercent: -25,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    }
  );

  server.registerTool(
    "search_company_docs",
    {
      title: "Search Company Docs",
      description: "Search the company docs for information",
      inputSchema: z.object({
        query: z.string().describe("The query to search the company docs for"),
      }),
    },
    async ({ query }) => {
      console.log(">>> MCP TOOL CALLED: search_company_docs", query);
      const data = {
        query,
        results: [
          {
            title: "Reorder policy",
            text: "Reorder when any core size drops below 30 units. Lead time is 3 weeks.",
          },
          {
            title: "Size curve",
            text: "Sizes 9-10.5 make up 55% of trail runner sales.",
          },
        ],
      };
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    }
  );
});

export { handler as GET, handler as POST };
