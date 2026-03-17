"use client";
import { useState, useEffect, useCallback } from "react";
import { ThreadList } from "./ThreadList";
import { ThreadView } from "./ThreadView";
import { MessageSkeletonList } from "./MessageSkeleton";
import { EmptyState } from "./EmptyState";
import type { Thread, Message } from "@/lib/api/types";

interface Props {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  errorHint: string | null;
  jumpTarget: string | null;
  onJumpComplete: () => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
  jumpTo: (id: string) => boolean;
  jumpThreadId: string | null;
  onActiveThreadChange?: (thread: Thread | null) => void;
  onRepliesLoaded?: (replies: Message[]) => void;
}

export function ChatArea({
  threads,
  loading,
  error,
  errorHint,
  jumpTarget,
  onJumpComplete,
  registerRef,
  jumpTo,
  jumpThreadId,
  onActiveThreadChange,
  onRepliesLoaded,
}: Props) {
  const [activeThread, setActiveThread] = useState<Thread | null>(null);

  const changeActiveThread = useCallback((thread: Thread | null) => {
    setActiveThread(thread);
    onActiveThreadChange?.(thread);
  }, [onActiveThreadChange]);

  // When jumpThreadId changes, open the right thread
  useEffect(() => {
    if (!jumpThreadId || loading) return;
    const thread = threads.find(
      (t) => t.post.id === jumpThreadId || t.replies.some((r) => r.id === jumpThreadId)
    );
    if (thread) changeActiveThread(thread);
  }, [jumpThreadId, threads, loading, changeActiveThread]);

  // Reset thread view when publication changes (threads array replaced)
  useEffect(() => {
    changeActiveThread(null);
  }, [threads, changeActiveThread]);

  if (loading) return <MessageSkeletonList />;
  if (error) return <EmptyState type="error" error={error} hint={errorHint} />;
  if (threads.length === 0) return <EmptyState type="no-messages" />;

  if (activeThread) {
    return (
      <ThreadView
        thread={activeThread}
        onBack={() => changeActiveThread(null)}
        registerRef={registerRef}
        jumpTarget={jumpTarget}
        onJumpComplete={onJumpComplete}
        jumpTo={jumpTo}
        onRepliesLoaded={onRepliesLoaded}
      />
    );
  }

  return <ThreadList threads={threads} onOpen={(t) => changeActiveThread(t)} />;
}
