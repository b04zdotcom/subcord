"use client";
import { useEffect, useRef } from "react";
import type { Message } from "@/lib/api/types";

const DEFAULT_WS_URL = "wss://zyncrealtime.substack.com/";
const RECONNECT_DELAY = 3000;
const MAX_RETRIES = 5;
const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000;

interface TokenResponse {
  token: string;
  expiry?: string;
  endpoint?: string;
  channels?: string[];
}

async function fetchToken(publicationId: string): Promise<TokenResponse | null> {
  try {
    const res = await fetch(`/api/substack/realtime-token?publicationId=${encodeURIComponent(publicationId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function getTokenExpiry(tokenData: TokenResponse): number {
  if (tokenData.expiry) {
    const ms = new Date(tokenData.expiry).getTime();
    if (!isNaN(ms)) return ms;
  }
  try {
    const payload = JSON.parse(atob(tokenData.token.split(".")[1]));
    return payload.exp * 1000;
  } catch {
    return Date.now() + 55 * 60 * 1000;
  }
}

const REACTION_EMOJI_MAP: Record<string, string> = {
  thumbs_up: "👍",
  upvote: "❤️",
  face_with_tears_of_joy: "😂",
  fire: "🔥",
  raised_hands: "🙌",
  heart_eyes: "😍",
  sob: "😭",
  exploding_head: "🤯",
  clap: "👏",
  pray: "🙏",
};

function normalizeWsComment(comment: Record<string, unknown>, publicationId: string): Message | null {
  const id = String(comment.id ?? "");
  const body = String(comment.body ?? comment.raw_body ?? "").trim();
  if (!id || !body) return null;

  const author = comment.author as Record<string, unknown> | undefined;

  const rawAttachments = (comment.mediaAttachments ?? []) as Record<string, unknown>[];
  const attachments = Array.isArray(rawAttachments)
    ? rawAttachments
        .filter((a) => {
          const ct = String(a.contentType ?? a.content_type ?? a.type ?? "");
          return ct.startsWith("image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(String(a.url ?? ""));
        })
        .map((a) => ({ url: String(a.url), contentType: a.contentType ? String(a.contentType) : undefined }))
    : [];

  const rawReactions = comment.reactions as Record<string, unknown> | undefined;
  const reactions = rawReactions
    ? Object.entries(rawReactions).map(([key, count]) => ({
        emoji: REACTION_EMOJI_MAP[key] ?? key,
        count: Number(count),
      }))
    : [];

  return {
    id,
    body,
    author: {
      id: String(author?.id ?? "unknown"),
      name: String(author?.name ?? "Unknown"),
      photoUrl: author?.photo_url ? String(author.photo_url) : undefined,
      handle: author?.handle ? String(author.handle) : undefined,
    },
    createdAt: String(comment.created_at ?? new Date().toISOString()),
    publicationId,
    parentId: comment.parent_id ? String(comment.parent_id) : undefined,
    ...(attachments.length > 0 ? { attachments } : {}),
    ...(reactions.length > 0 ? { reactions } : {}),
  };
}

export function useRealtimeUpdates(
  publicationId: string | null,
  threadPostId: string | null,
  onNewMessage: (msg: Message) => void,
  onUpdatedMessage: (msg: Message) => void,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(true);

  useEffect(() => {
    if (!publicationId) return;
    activeRef.current = true;
    retriesRef.current = 0;

    function cleanup() {
      activeRef.current = false;
      if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    }

    async function connect() {
      if (!activeRef.current) return;

      const tokenData = await fetchToken(publicationId!);
      if (!tokenData?.token || !activeRef.current) return;

      const { token, endpoint } = tokenData;

      const expiry = getTokenExpiry(tokenData);
      const refreshIn = Math.max(0, expiry - Date.now() - TOKEN_REFRESH_BUFFER_MS);
      if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = setTimeout(() => {
        if (activeRef.current) reconnect();
      }, refreshIn);

      const ws = new WebSocket(endpoint ?? DEFAULT_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!activeRef.current) { ws.close(); return; }
        retriesRef.current = 0;
        ws.send(JSON.stringify({
          token,
          action: "subscribe",
          channel: `chat:${publicationId}:only_paid`,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const outer = JSON.parse(event.data);
          if (outer?.data?.status === "OK") return;

          const inner = typeof outer?.data?.message === "string"
            ? JSON.parse(outer.data.message)
            : null;

          if (inner?.comment) {
            const comment = inner.comment as Record<string, unknown>;
            if (threadPostId && comment.post_id !== threadPostId) return;
            const msg = normalizeWsComment(comment, publicationId!);
            if (!msg) return;
            if (inner.type === "chat:new-comment") onNewMessage(msg);
            else if (inner.type === "chat:updated-comment") onUpdatedMessage(msg);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!activeRef.current) return;
        if (retriesRef.current < MAX_RETRIES) {
          retriesRef.current++;
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    function reconnect() {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      connect();
    }

    connect();
    return cleanup;
  }, [publicationId, threadPostId, onNewMessage, onUpdatedMessage]);
}
