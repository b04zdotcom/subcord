"use client";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/lib/api/types";

interface Props {
  messages: Message[];
  registerRef: (id: string, el: HTMLElement | null) => void;
}

export function MessageList({ messages, registerRef }: Props) {
  // Group top-level messages with their replies
  const topLevel = messages.filter((m) => !m.parentId);
  const repliesMap = new Map<string, Message[]>();

  for (const m of messages) {
    if (m.parentId) {
      const existing = repliesMap.get(m.parentId) ?? [];
      repliesMap.set(m.parentId, [...existing, m]);
    }
  }

  return (
    <div className="space-y-1 py-4">
      {topLevel.map((msg) => {
        const replies = repliesMap.get(msg.id) ?? [];
        return (
          <div key={msg.id}>
            <MessageBubble message={msg} registerRef={registerRef} />
            {replies.map((reply) => (
              <MessageBubble
                key={reply.id}
                message={reply}
                registerRef={registerRef}
                isReply
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
