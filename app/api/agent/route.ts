import { ToolLoopAgent, isStepCount, tool } from "ai";
import { z } from "zod";

export const maxDuration = 60;

const getSales = tool({
  description: "Get weekly unit sales for a product: this week vs last week",
  inputSchema: z.object({ product: z.string() }),
  execute: async ({ product }) => ({
    product,
    thisWeek: 312,
    lastWeek: 416,
    changePercent: -25,
  }),
});

const getInventory = tool({
  description:
    "Get current stock for a product, including which sizes are out of stock",
  inputSchema: z.object({ product: z.string() }),
  execute: async ({ product }) => ({
    product,
    unitsOnHand: 140,
    unitsLastWeek: 233,
    sizesOutOfStock: ["9", "9.5", "10", "10.5"],
  }),
});

const searchDocs = tool({
  description:
    "Search internal company docs: ops policies, reorder rules, playbooks",
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ query }) => ({
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
  }),
});

const analyst = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-5.5",
  instructions:
    "You are a sales analyst for an outdoor apparel brand. " +
    "Investigate with tools before concluding. Say which tool each fact came from.",
  tools: { getSales, getInventory, searchDocs },
  stopWhen: isStepCount(10),
  onStepEnd({ stepNumber, text, toolCalls }) {
    console.log(`\n--- STEP ${stepNumber} ---`);
    if (text) console.log("THOUGHT:", text);
    for (const c of toolCalls) console.log("CALL:", c.toolName, c.input);
  },
});

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();
  const result = await analyst.generate({ prompt });
  return Response.json({ text: result.text, steps: result.steps.length });
}
