"use client";
import { useState, useEffect } from "react";
import type { Publication } from "@/lib/api/types";

export function usePublications() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/substack/publications");
        const json = await res.json();
        if (!cancelled) {
          if (!res.ok) {
            setError(json.error ?? "Failed to load publications");
            setPublications([]);
          } else {
            setPublications(json.data ?? []);
          }
        }
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { publications, loading, error };
}
