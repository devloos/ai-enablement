import { generateText, isStepCount, tool } from "ai";
import { z } from "zod";

const getSales = tool({
  description:
    "Get ecommerce revenue for the last N days and the N days before that",
  inputSchema: z.object({
    days: z.number().describe("How many days back to look"),
  }),
  execute: async ({ days }) => {
    console.log(">>> MY CODE IS RUNNING getSales with days =", days);
    return { days, revenue: 128400, previousRevenue: 145200 };
  },
});

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = await generateText({
    model: "anthropic/claude-sonnet-5.5",
    instructions: "You are a sales analyst for an outdoor apparel brand.",
    prompt,
    tools: { getSales },
    stopWhen: isStepCount(5),
    onStepEnd({ stepNumber, finishReason, toolCalls, toolResults, usage }) {
      console.log(`--- STEP ${stepNumber} (${finishReason}) ---`);
      for (const c of toolCalls)
        console.log("MODEL ASKED FOR:", c.toolName, c.input);
      for (const r of toolResults) console.log("MY APP RETURNED:", r.output);
      console.log("TOKENS IN:", usage.inputTokens);
    },
  });

  return Response.json({ text: result.text, steps: result.steps.length });
}
