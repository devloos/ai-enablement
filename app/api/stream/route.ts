import { streamText, toTextStream, createTextStreamResponse } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = streamText({
    model: "anthropic/claude-sonnet-5.5",
    instructions: "You are a sales analyst for an outdoor apparel brand.",
    prompt,
    onEnd({ usage, finishReason }) {
      console.log("DONE:", finishReason, usage);
    },
  });

  console.log("RETURNING RESPONSE");

  return createTextStreamResponse({
    stream: toTextStream({ stream: result.stream }),
  });
}
