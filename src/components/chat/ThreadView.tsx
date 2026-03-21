"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, ArrowDown, Loader2, SendHorizonal, X } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { useReplies } from "@/hooks/useReplies";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import type { Thread, Message } from "@/lib/api/types";

interface Props {
  thread: Thread;
  onBack: () => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
  jumpTarget: string | null;
  onJumpComplete: () => void;
  jumpTo: (id: string) => boolean;
  onRepliesLoaded?: (replies: Message[]) => void;
}

export function ThreadView({ thread, onBack, registerRef, jumpTarget, onJumpComplete, jumpTo, onRepliesLoaded }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { replies, setReplies, loading, loadReplies, postReply } = useReplies();
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // "New messages" divider + unread count — tracks messages received while window is not active
  const [newDividerId, setNewDividerId] = useState<string | null>(null);
  const newDividerIdRef = useRef<string | null>(null);
  const isActiveRef = useRef(true);
  const unreadCountRef = useRef(0);
  const notifiedIdsRef = useRef(new Set<string>());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  async function requestNotifications() {
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  useEffect(() => {
    function onHide() {
      isActiveRef.current = false;
      setNewDividerId(null);
      newDividerIdRef.current = null;
      unreadCountRef.current = 0;
      notifiedIdsRef.current.clear();
      document.title = "Subcord";
    }
    function onShow() {
      isActiveRef.current = true;
      unreadCountRef.current = 0;
      notifiedIdsRef.current.clear();
      document.title = "Subcord";
    }
    function onVisibility() {
      if (document.hidden) onHide(); else onShow();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onHide);
    window.addEventListener("focus", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onHide);
      window.removeEventListener("focus", onShow);
      document.title = "Subcord";
    };
  }, []);

  useEffect(() => {
    loadReplies(thread.post.id);
  }, [thread.post.id, loadReplies]);

  // Realtime updates via WebSocket — append new messages directly, no polling needed
  const handleNewMessage = useCallback((msg: Message) => {
    setReplies((prev) => {
      if (prev.some((r) => r.id === msg.id)) return prev;
      if (!isActiveRef.current && newDividerIdRef.current === null) {
        newDividerIdRef.current = msg.id;
        setNewDividerId(msg.id);
      }
      return [...prev, msg];
    });
    if (!isActiveRef.current && !notifiedIdsRef.current.has(msg.id)) {
      notifiedIdsRef.current.add(msg.id);
      unreadCountRef.current += 1;
      document.title = `(${unreadCountRef.current}) Subcord`;
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          const body = msg.body.length > 100 ? msg.body.slice(0, 100) + "…" : msg.body;
          const n = new Notification(msg.author.name, { body });
          n.onclick = () => { window.focus(); n.close(); };
        } catch (e) {
          console.warn("[notifications] failed to show notification:", e);
        }
      } else {
        console.log("[notifications] skipped — permission:", typeof Notification !== "undefined" ? Notification.permission : "unavailable");
      }
    }
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }), 50);
    }
  }, [setReplies]);

  const handleUpdatedMessage = useCallback((msg: Message) => {
    setReplies((prev) => prev.map((r) => r.id === msg.id ? msg : r));
  }, [setReplies]);

  useRealtimeUpdates(thread.post.publicationId || null, thread.post.id, handleNewMessage, handleUpdatedMessage);

  // Scroll to bottom and notify parent when replies load
  useEffect(() => {
    if (!loading) {
      const el = scrollRef.current;
      if (el) {
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distanceFromBottom < 200) {
          el.scrollTo({ top: el.scrollHeight });
        }
      }
      onRepliesLoaded?.(replies);
    }
  }, [loading, replies, onRepliesLoaded]);

  // Handle jump target
  useEffect(() => {
    if (!jumpTarget || loading) return;
    const timer = setTimeout(() => {
      if (jumpTo(jumpTarget)) onJumpComplete();
    }, 100);
    return () => clearTimeout(timer);
  }, [jumpTarget, loading, jumpTo, onJumpComplete]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  }

  function scrollToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }

  const handleReplyTo = useCallback((msg: Message) => {
    setReplyingTo(msg);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  async function handleSend() {
    const trimmed = replyText.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const ok = await postReply(thread.post.id, trimmed, replyingTo?.id);
    if (ok) { setReplyText(""); setReplyingTo(null); }
    setSending(false);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-discord-border flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-discord-text-muted hover:text-discord-text-primary transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-discord-border select-none">|</span>
        <span className="text-sm text-discord-text-secondary font-medium truncate flex-1">
          Thread · {thread.post.author.name}
        </span>
        {notifPermission === "default" && (
          <button
            onClick={requestNotifications}
            className="flex-shrink-0 text-xs text-discord-text-muted hover:text-discord-text-primary transition-colors"
          >
            Enable notifications
          </button>
        )}
      </div>

      {/* Scrollable message area */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-4 relative">
        {/* Original post — always by the thread author */}
        <MessageBubble message={{ ...thread.post, isAuthor: true }} registerRef={registerRef} />

        {/* Divider */}
        {(loading || replies.length > 0) && (
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex-1 h-px bg-discord-border" />
            <span className="text-xs text-discord-text-muted">
              {loading ? "Loading replies…" : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
            </span>
            <div className="flex-1 h-px bg-discord-border" />
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-discord-text-muted" />
          </div>
        )}

        <div className="flex flex-col gap-2">
        {replies.map((msg) => (
          <React.Fragment key={msg.id}>
            {newDividerId === msg.id && (
              <div className="flex items-center gap-3 px-4 py-1">
                <div className="flex-1 h-px bg-red-500 opacity-50" />
                <span className="text-xs font-semibold text-red-500">New messages</span>
                <div className="flex-1 h-px bg-red-500 opacity-50" />
              </div>
            )}
            <MessageBubble
              message={{ ...msg, isAuthor: msg.author.id === thread.post.author.id }}
              registerRef={registerRef}
              isReply
              onReply={handleReplyTo}
            />
          </React.Fragment>
        ))}
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-4 z-10 bg-discord-tertiary hover:bg-discord-hover border border-discord-border rounded-full p-3 text-discord-text-muted hover:text-discord-text-primary shadow-lg transition-colors"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Reply input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-discord-border">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 px-1 text-xs text-discord-text-muted">
            <span>Replying to <span className="font-semibold" style={{ color: "#cc874a" }}>{replyingTo.author.name}</span></span>
            <button onClick={() => setReplyingTo(null)} className="ml-auto hover:text-discord-text-primary transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 bg-discord-input rounded-lg px-3 py-2">
          <textarea
            ref={textareaRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={replyingTo ? `Reply to ${replyingTo.author.name}…` : "Write a reply…"}
            rows={1}
            className="flex-1 bg-transparent text-sm text-discord-text-primary placeholder:text-discord-text-muted resize-none outline-none leading-relaxed"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="flex-shrink-0 p-1 text-discord-accent disabled:text-discord-text-muted transition-colors hover:text-discord-accent-hover disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-discord-text-muted mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
