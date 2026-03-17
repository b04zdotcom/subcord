"use client";
import { formatDistanceToNow, parseISO } from "date-fns";
import { buildHighlightSegments, extractSnippet } from "@/lib/utils/highlight";
import type { SearchableMessage } from "@/lib/api/types";
import { type FuseResult } from "fuse.js";

interface Props {
  result: FuseResult<SearchableMessage>;
  isActive: boolean;
  onClick: () => void;
}

export function SearchResult({ result, isActive, onClick }: Props) {
  const { item, matches } = result;

  const bodyMatch = matches?.find((m: { key?: string }) => m.key === "body");
  const snippet = extractSnippet(item.body, 140);
  const segments = bodyMatch?.indices
    ? buildHighlightSegments(snippet, bodyMatch.indices as [number, number][])
    : [{ text: snippet, highlight: false }];

  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true });
  } catch {
    // ignore
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded transition-colors ${
        isActive
          ? "bg-discord-active"
          : "hover:bg-discord-hover"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-discord-accent truncate">
            {item.author.name}
          </span>
          <span className="text-xs text-discord-text-muted truncate">
            in {item.publicationName}
          </span>
        </div>
        <span className="text-xs text-discord-text-muted flex-shrink-0">{timeAgo}</span>
      </div>
      <p className="text-sm text-discord-text-secondary leading-relaxed">
        {segments.map((seg, i) =>
          seg.highlight ? (
            <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </p>
    </button>
  );
}
