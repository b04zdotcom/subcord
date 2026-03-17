"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { SearchResult } from "./SearchResult";
import { useSearch } from "./useSearch";
import type { SearchableMessage } from "@/lib/api/types";

interface Props {
  corpus: SearchableMessage[];
  onJump: (messageId: string, subdomain: string) => void;
  onClose: () => void;
}

export function SearchOverlay({ corpus, onJump, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { query, search, results, clear } = useSearch(corpus);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  const handleJump = useCallback(
    (index: number) => {
      const result = results[index];
      if (!result) return;
      onJump(result.item.id, result.item.subdomain);
      clear();
      onClose();
    },
    [results, onJump, clear, onClose]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      handleJump(activeIndex);
    }
  }

  // Scroll active result into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-discord-secondary rounded-lg shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-discord-border">
          <Search className="w-5 h-5 text-discord-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => search(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages and authors…"
            className="flex-1 bg-transparent text-discord-text-primary outline-none text-sm placeholder-discord-text-muted"
          />
          {query && (
            <button
              onClick={() => { clear(); inputRef.current?.focus(); }}
              className="text-discord-text-muted hover:text-discord-text-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-discord-text-muted hover:text-discord-text-secondary text-xs"
          >
            Esc
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-96 overflow-y-auto p-2"
        >
          {query.length >= 2 && results.length === 0 && (
            <p className="text-discord-text-muted text-sm text-center py-8">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {query.length < 2 && corpus.length === 0 && (
            <p className="text-discord-text-muted text-sm text-center py-8">
              Open a chat first to enable search
            </p>
          )}

          {query.length < 2 && corpus.length > 0 && (
            <p className="text-discord-text-muted text-sm text-center py-8">
              Type at least 2 characters to search {corpus.length} messages
            </p>
          )}

          {results.map((result, i) => (
            <SearchResult
              key={result.item.id}
              result={result}
              isActive={i === activeIndex}
              onClick={() => handleJump(i)}
            />
          ))}
        </div>

        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-discord-border text-xs text-discord-text-muted flex gap-4">
            <span>↑↓ navigate</span>
            <span>↵ jump to message</span>
            <span>Esc close</span>
          </div>
        )}
      </div>
    </div>
  );
}
