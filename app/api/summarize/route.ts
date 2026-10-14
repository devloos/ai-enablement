import { generateText, type ModelMessage } from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: ModelMessage[] } = await req.json();

  const result = await generateText({
    model: "anthropic/claude-sonnet-5.5",
    instructions:
      "You are a sales analyst for an outdoor apparel brand. " +
      "Answer in 3 bullets max. Flag anything that needs action.",
    messages,
    include: { requestBody: true },
  });

  console.log("SENT:", JSON.stringify(result.finalStep.request.body, null, 2));
  console.log("USAGE:", result.usage);

  return Response.json({ text: result.text });
}
