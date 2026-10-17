import { generateText, Output } from "ai";
import { z } from "zod";

const SalesReport = z.object({
  period: z
    .string()
    .describe("The period exactly as stated in the input, e.g. 'Q3'"),
  comparisonBasis: z
    .enum(["year_over_year", "quarter_over_quarter", "not_stated"])
    .describe("Only pick a comparison if the input explicitly says so"),
  metrics: z.array(
    z.object({
      name: z.string(),
      changePercent: z.number(),
      direction: z.enum(["up", "down", "flat"]),
    })
  ),
  actionItems: z.array(
    z.object({
      issue: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      suggestedAction: z.string(),
    })
  ),
});

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = await generateText({
    model: "anthropic/claude-sonnet-5.5",
    instructions:
      "You extract structured sales data. Never invent facts that are not in the input.",
    prompt,
    output: Output.object({ schema: SalesReport }),
    include: { requestBody: true },
  });

  console.log("SENT:", JSON.stringify(result.finalStep.request.body, null, 2));
  console.log("OUTPUT:", result.output);

  return Response.json(result.output);
}
