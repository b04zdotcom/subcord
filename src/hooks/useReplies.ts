"use client";
import { useState, useCallback } from "react";
import type { Message, Author } from "@/lib/api/types";

const replyCache = new Map<string, Message[]>();

export function useReplies() {
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReplies = useCallback(async (postId: string) => {
    const cached = replyCache.get(postId);
    if (cached) {
      setReplies(cached);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/substack/replies?postId=${encodeURIComponent(postId)}`);
      const json = await res.json();
      const data: Message[] = json.data ?? [];
      replyCache.set(postId, data);
      setReplies(data);
      if (!res.ok) setError(json.error ?? "Failed to load replies");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshReplies = useCallback(async (postId: string) => {
    replyCache.delete(postId);
    try {
      const res = await fetch(`/api/substack/replies?postId=${encodeURIComponent(postId)}`);
      const json = await res.json();
      const data: Message[] = json.data ?? [];
      replyCache.set(postId, data);
      setReplies(data);
    } catch {
      // silently ignore background refresh errors
    }
  }, []);

  const postReply = useCallback(async (postId: string, body: string, quoteId?: string, author?: Author): Promise<boolean> => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      body,
      author: author ?? { id: "me", name: "You" },
      createdAt: new Date().toISOString(),
      publicationId: "",
      ...(quoteId ? { parentId: quoteId } : {}),
    };
    setReplies((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/substack/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body, ...(quoteId ? { quoteId } : {}) }),
      });
      if (!res.ok) {
        setReplies((prev) => prev.filter((r) => r.id !== tempId));
        return false;
      }
      refreshReplies(postId); // fire without await — replaces optimistic with real data
      return true;
    } catch {
      setReplies((prev) => prev.filter((r) => r.id !== tempId));
      return false;
    }
  }, [refreshReplies]);

  return { replies, setReplies, loading, error, loadReplies, refreshReplies, postReply };
}
