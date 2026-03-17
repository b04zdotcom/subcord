"use client";
import { MessageSquare, Loader2, X } from "lucide-react";
import { PublicationItem } from "./PublicationItem";
import type { Publication } from "@/lib/api/types";

interface Props {
  publications: Publication[];
  loading: boolean;
  error: string | null;
  activeId: string | null;
  onSelect: (pub: Publication) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ publications, loading, error, activeId, onSelect, isOpen, onClose }: Props) {
  function handleSelect(pub: Publication) {
    onSelect(pub);
    onClose();
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          flex flex-col bg-discord-secondary border-r border-discord-border
          fixed inset-y-0 left-0 z-30 transition-transform duration-200
          md:static md:translate-x-0 md:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ width: 240, minWidth: 240 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 border-b border-discord-border shadow-sm" style={{ height: 53 }}>
          <MessageSquare className="w-5 h-5 text-discord-accent" />
          <span className="font-semibold text-discord-text-primary text-sm flex-1">Subcord</span>
          <button onClick={onClose} className="md:hidden p-1 text-discord-text-muted hover:text-discord-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Publication list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-discord-text-muted" />
            </div>
          )}

          {error && !loading && (
            <div className="px-2 py-4 text-center space-y-2">
              <p className="text-discord-danger text-xs">{error}</p>
              <a href="/login" className="text-xs text-discord-accent hover:underline">
                Sign in again
              </a>
            </div>
          )}

          {!loading && !error && publications.length === 0 && (
            <p className="text-discord-text-muted text-xs px-2 py-4 text-center">
              No chats found
            </p>
          )}

          {publications.map((pub) => (
            <PublicationItem
              key={pub.id}
              publication={pub}
              isActive={pub.id === activeId}
              onClick={() => handleSelect(pub)}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
