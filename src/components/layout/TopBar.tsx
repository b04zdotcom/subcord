"use client";
import { Search, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Publication } from "@/lib/api/types";

interface Props {
  activePublication: Publication | null;
  onSearchOpen: () => void;
  onMenuOpen: () => void;
}

export function TopBar({ activePublication, onSearchOpen, onMenuOpen }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="flex items-center gap-3 px-4 border-b border-discord-border bg-discord-primary shadow-sm" style={{ height: 53 }}>
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuOpen}
        className="md:hidden p-1 text-discord-text-muted hover:text-discord-text-primary transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Current chat title */}
      <div className="flex-1 min-w-0">
        {activePublication ? (
          <span className="font-semibold text-discord-text-primary text-sm truncate">
            {activePublication.name}
          </span>
        ) : (
          <span className="text-discord-text-muted text-sm">Select a chat</span>
        )}
      </div>

      {/* Search button */}
      <button
        onClick={onSearchOpen}
        className="flex items-center gap-2 bg-discord-tertiary hover:bg-discord-input text-discord-text-muted hover:text-discord-text-secondary rounded px-3 py-1.5 text-sm transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search</span>
        <kbd className="ml-1 text-xs bg-discord-border px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="p-2 text-discord-text-muted hover:text-discord-danger transition-colors rounded hover:bg-discord-hover"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  );
}
