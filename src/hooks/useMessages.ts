"use client";
import { useState, useCallback, useRef } from "react";
import type { Thread, SearchableMessage } from "@/lib/api/types";

const threadCache = new Map<string, { threads: Thread[]; pubName: string }>();

export function useMessages() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const currentSubdomain = useRef<string | null>(null);

  const loadMessages = useCallback(
    async (subdomain: string, pubName: string, numericId?: string) => {
      currentSubdomain.current = subdomain;

      const cached = threadCache.get(subdomain);
      if (cached) {
        setThreads(cached.threads);
        setError(null);
        setErrorHint(null);
        return;
      }

      setLoading(true);
      setError(null);
      setErrorHint(null);

      try {
        const params = new URLSearchParams({ pub: subdomain });
        if (numericId && numericId !== subdomain) params.set("id", numericId);
        const res = await fetch(`/api/substack/messages?${params}`);
        const json = await res.json();

        if (currentSubdomain.current !== subdomain) return;

        if (!res.ok) {
          setError(json.error ?? "Failed to load messages");
          setErrorHint(json.hint ?? null);
          setThreads([]);
        } else {
          const data: Thread[] = json.data ?? [];
          threadCache.set(subdomain, { threads: data, pubName });
          setThreads(data);
        }
      } catch {
        if (currentSubdomain.current === subdomain) setError("Network error");
      } finally {
        if (currentSubdomain.current === subdomain) setLoading(false);
      }
    },
    []
  );

  const getAllCachedMessages = useCallback((): SearchableMessage[] => {
    return Array.from(threadCache.entries()).flatMap(([subdomain, { threads, pubName }]) =>
      threads.flatMap(({ post, replies }) =>
        [post, ...replies].map((m) => ({ ...m, publicationName: pubName, subdomain }))
      )
    );
  }, []);

  const clearCache = useCallback(() => { threadCache.clear(); }, []);

  return { threads, loading, error, errorHint, loadMessages, getAllCachedMessages, clearCache };
}
