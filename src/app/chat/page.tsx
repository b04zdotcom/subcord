"use client";
import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ChatArea } from "@/components/chat/ChatArea";
import { EmptyState } from "@/components/chat/EmptyState";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { usePublications } from "@/hooks/usePublications";
import { useMessages } from "@/hooks/useMessages";
import { useJumpToMessage } from "@/hooks/useJumpToMessage";
import type { Publication, Thread, Message } from "@/lib/api/types";

export default function ChatPage() {
  const { publications, loading: pubsLoading, error: pubsError } = usePublications();
  const { threads, loading: msgsLoading, error: msgsError, errorHint, loadMessages } = useMessages();
  const { registerRef, jumpTo } = useJumpToMessage();

  const [activePub, setActivePub] = useState<Publication | null>(null);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [threadReplies, setThreadReplies] = useState<Message[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jumpTarget, setJumpTarget] = useState<string | null>(null);
  const [jumpThreadId, setJumpThreadId] = useState<string | null>(null);
  const [pendingJump, setPendingJump] = useState<{ messageId: string; subdomain: string } | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function handleSelectPub(pub: Publication) {
    setActivePub(pub);
    setActiveThread(null);
    setThreadReplies([]);
    loadMessages(pub.subdomain, pub.name, pub.id);
  }

  const handleActiveThreadChange = useCallback((t: Thread | null) => {
    setActiveThread(t);
    setThreadReplies([]);
  }, []);

  const handleJump = useCallback(
    (messageId: string, subdomain: string) => {
      const pub = publications.find((p) => p.subdomain === subdomain);

      if (activePub?.subdomain === subdomain) {
        setJumpTarget(messageId);
        setJumpThreadId(messageId);
      } else if (pub) {
        setActivePub(pub);
        loadMessages(pub.subdomain, pub.name, pub.id);
        setPendingJump({ messageId, subdomain });
      }
    },
    [activePub, publications, loadMessages]
  );

  // Handle pending jump after publication switches and messages load
  useEffect(() => {
    if (!pendingJump || msgsLoading) return;
    if (activePub?.subdomain === pendingJump.subdomain) {
      setJumpTarget(pendingJump.messageId);
      setJumpThreadId(pendingJump.messageId);
      setPendingJump(null);
    }
  }, [pendingJump, msgsLoading, activePub]);

  return (
    <>
      <Sidebar
        publications={publications}
        loading={pubsLoading}
        error={pubsError}
        activeId={activePub?.id ?? null}
        onSelect={handleSelectPub}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar activePublication={activePub} onSearchOpen={() => setSearchOpen(true)} onMenuOpen={() => setSidebarOpen(true)} />

        {!activePub ? (
          <EmptyState type="no-selection" />
        ) : (
          <ChatArea
            threads={threads}
            loading={msgsLoading}
            error={msgsError}
            errorHint={errorHint}
            jumpTarget={jumpTarget}
            onJumpComplete={() => setJumpTarget(null)}
            registerRef={registerRef}
            jumpTo={jumpTo}
            jumpThreadId={jumpThreadId}
            onActiveThreadChange={handleActiveThreadChange}
            onRepliesLoaded={setThreadReplies}
          />
        )}
      </div>

      {searchOpen && (
        <SearchOverlay
          corpus={activeThread
            ? [activeThread.post, ...threadReplies].map((m) => ({
                ...m,
                publicationName: activePub?.name ?? "",
                subdomain: activePub?.subdomain ?? "",
              }))
            : []
          }
          onJump={handleJump}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </>
  );
}
