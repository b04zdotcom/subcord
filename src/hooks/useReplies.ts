"use client";
import { useState, useCallback } from "react";
import type { Message } from "@/lib/api/types";

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

  const postReply = useCallback(async (postId: string, body: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/substack/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body }),
      });
      if (!res.ok) return false;
      await refreshReplies(postId);
      return true;
    } catch {
      return false;
    }
  }, [refreshReplies]);

  return { replies, loading, error, loadReplies, refreshReplies, postReply };
}
