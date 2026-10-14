import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "anthropic/claude-sonnet-5.5",
    instructions:
      "You are a sales analyst for an outdoor apparel brand. " +
      "Answer in 3 bullets max. Flag anything that needs action.",
    messages: await convertToModelMessages(messages),
    onEnd({ usage }) {
      console.log("USAGE:", usage);
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
