import { Suspense } from "react";
import { Chat } from "./chat";

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading…</p>}>
      <Chat />
    </Suspense>
  );
}
