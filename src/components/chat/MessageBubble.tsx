"use client";
import Image from "next/image";
import { parseISO } from "date-fns";
import type { Message } from "@/lib/api/types";

function addLinkTargets(html: string): string {
  return html.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
}

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g;

function linkifyText(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        className="text-discord-accent underline underline-offset-2 hover:text-discord-accent-hover break-all">
        {part}
      </a>
    ) : part
  );
}

interface Props {
  message: Message;
  registerRef: (id: string, el: HTMLElement | null) => void;
  isReply?: boolean;
}

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-discord-tertiary flex-shrink-0 flex items-center justify-center text-xs font-bold text-discord-text-muted relative" style={{ zIndex: 1 }}>
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={name}
          width={40}
          height={40}
          className="object-cover w-full h-full"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

function formatTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
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
  } catch {
    return "";
  }
}

export function MessageBubble({ message, registerRef }: Props) {
  return (
    <div
      ref={(el) => registerRef(message.id, el)}
      id={`msg-${message.id}`}
      className={`px-4 py-1.5 group transition-colors${message.isAuthor ? " border-l-2" : ""}`}
      style={message.isAuthor ? { borderLeftColor: "#de9c36", backgroundColor: "rgba(222,156,54,0.08)" } : undefined}
      onMouseEnter={(e) => { if (window.matchMedia("(hover: hover)").matches) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#242428"; }}
      onMouseLeave={(e) => { if (window.matchMedia("(hover: hover)").matches) (e.currentTarget as HTMLDivElement).style.backgroundColor = message.isAuthor ? "rgba(222,156,54,0.08)" : ""; }}
    >
      {message.quotedMessage && (
        <div className="relative mb-1 opacity-70" style={{ paddingLeft: 56 }}>
          {/* L-shaped connector: horizontal left then down to avatar */}
          <div style={{
            position: "absolute",
            left: 20,
            top: "50%",
            width: 20,
            height: 34,
            borderLeft: "1.5px solid rgba(128,132,142,0.5)",
            borderTop: "1.5px solid rgba(128,132,142,0.5)",
            borderTopLeftRadius: 4,
            zIndex: 0,
          }} />
          <div className="flex items-baseline gap-1.5 min-w-0 overflow-hidden">
            <span className="text-xs font-semibold text-discord-text-muted whitespace-nowrap">{message.quotedMessage.author.name}</span>
            <span className="text-xs text-discord-text-muted truncate">{message.quotedMessage.body || (message.quotedMessage.attachments?.length ? "🖼 Image" : "")}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
      <Avatar name={message.author.name} photoUrl={message.author.photoUrl} />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-semibold" style={{ color: "#cc874a" }}>
            {message.author.name}
          </span>
          <span className="text-xs text-discord-text-muted">
            {formatTime(message.createdAt)}
          </span>
        </div>

        {message.bodyHtml ? (
          <div
            className="text-base text-discord-text-primary leading-relaxed prose-sm prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: addLinkTargets(message.bodyHtml) }}
          />
        ) : (
          <p className="text-base text-discord-text-primary leading-relaxed whitespace-pre-wrap break-words">
            {linkifyText(message.body)}
          </p>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {message.reactions.map((r, i) => (
              <span key={i} className="inline-flex items-center bg-discord-hover rounded-md px-1.5 py-0.5 text-sm text-discord-text-secondary">
                <span className={Array.from(r.emoji).every(c => c.charCodeAt(0) < 128) ? "text-[9px] mr-1.5" : "text-lg mr-1.5"}>{r.emoji}</span>
                <span className="font-semibold tracking-wide">{r.count}</span>
              </span>
            ))}
          </div>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 items-start">
            {message.attachments.map((att, i) => (
              <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={att.url}
                  alt=""
                  className="rounded-lg object-contain hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ maxWidth: "320px", maxHeight: "400px" }}
                />
              </a>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
