"use client";
import { useEffect, useRef, useState } from "react";
import { parseISO } from "date-fns";
import { MessageSquare } from "lucide-react";
import Image from "next/image";
import type { Thread } from "@/lib/api/types";
import { ImageModal } from "./ImageModal";

interface Props {
  threads: Thread[];
  onOpen: (thread: Thread) => void;
}

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-discord-tertiary flex-shrink-0 flex items-center justify-center text-xs font-bold text-discord-text-muted">
      {photoUrl ? (
        <Image src={photoUrl} alt={name} width={40} height={40} className="object-cover w-full h-full"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      ) : initials}
    </div>
  );
}

function formatTime(iso: string) {
  try {
    const date = parseISO(iso);
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined }) +
      " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export function ThreadList({ threads, onOpen }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [threads]);

  return (
    <>
    <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-0">
      {threads.map((thread) => (
        <div
          key={thread.post.id}
          className="px-4 py-3 transition-colors cursor-pointer"
          style={thread.post.isAuthor ? { backgroundColor: "rgba(222,156,54,0.08)" } : undefined}
          onMouseEnter={(e) => { if (window.matchMedia("(hover: hover)").matches) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#242428"; }}
          onMouseLeave={(e) => { if (window.matchMedia("(hover: hover)").matches) (e.currentTarget as HTMLDivElement).style.backgroundColor = thread.post.isAuthor ? "rgba(222,156,54,0.08)" : ""; }}
          onClick={() => onOpen(thread)}
        >
          <div className="flex gap-3">
            <Avatar name={thread.post.author.name} photoUrl={thread.post.author.photoUrl} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-semibold" style={{ color: "#cc874a" }}>
                  {thread.post.author.name}
                </span>
                <span className="text-xs text-discord-text-muted">{formatTime(thread.post.createdAt)}</span>
              </div>
              {thread.post.attachments && thread.post.attachments.length > 0 && (
                <div className="my-2 flex flex-col gap-2 items-start">
                  {thread.post.attachments.map((att, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={att.url}
                      alt=""
                      className="rounded-lg object-contain hover:opacity-90 transition-opacity cursor-pointer"
                      style={{ maxWidth: "320px", maxHeight: "400px" }}
                      onClick={(e) => { e.stopPropagation(); setLightboxSrc(att.url); }}
                    />
                  ))}
                </div>
              )}
              <p className="text-sm text-discord-text-secondary leading-relaxed whitespace-pre-wrap break-words">
                {thread.post.body}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(thread); }}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-white bg-discord-accent hover:bg-discord-accent-hover px-3 py-1.5 rounded-lg transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Open thread
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
    {lightboxSrc && <ImageModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
