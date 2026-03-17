"use client";
import Fuse, { type IFuseOptions, type FuseResult } from "fuse.js";
import { useMemo, useState, useCallback } from "react";
import type { SearchableMessage } from "@/lib/api/types";

const FUSE_OPTIONS: IFuseOptions<SearchableMessage> = {
  keys: [
    { name: "body", weight: 0.6 },
    { name: "author.name", weight: 0.3 },
    { name: "author.handle", weight: 0.1 },
  ],
  threshold: 0.35,
  includeMatches: true,
  minMatchCharLength: 2,
};

export function useSearch(corpus: SearchableMessage[]) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FuseResult<SearchableMessage>[]>([]);

  const fuse = useMemo(() => new Fuse(corpus, FUSE_OPTIONS), [corpus]);

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setResults(fuse.search(q, { limit: 50 }));
    },
    [fuse]
  );

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  return { query, search, results, clear };
}
