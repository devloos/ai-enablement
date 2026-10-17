"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      {messages.map((m) => (
        <div key={m.id} className="whitespace-pre-wrap">
          <strong>{m.role === "user" ? "You" : "AI"}:</strong>{" "}
          {m.parts.map((part, i) =>
            part.type === "text" ? <span key={i}>{part.text}</span> : null
          )}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="w-full border rounded p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            status === "streaming" ? "Thinking…" : "Ask about the sales report"
          }
        />
      </form>
    </main>
  );
}
