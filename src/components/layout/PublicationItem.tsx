"use client";
import Image from "next/image";
import type { Publication } from "@/lib/api/types";

interface Props {
  publication: Publication;
  isActive: boolean;
  onClick: () => void;
}

export function PublicationItem({ publication, isActive, onClick }: Props) {
  const initials = publication.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left transition-colors group ${
        isActive
          ? "bg-discord-active text-discord-text-primary"
          : "text-discord-text-secondary hover:bg-discord-hover hover:text-discord-text-primary"
      }`}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-xl overflow-hidden bg-white flex items-center justify-center text-xs font-bold">
        {publication.logoUrl ? (
          <Image
            src={publication.logoUrl}
            alt={publication.name}
            width={32}
            height={32}
            className="object-contain w-full h-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-discord-tertiary">{initials}</span>
        )}
      </div>
      <span className="truncate text-sm font-medium">{publication.name}</span>
    </button>
  );
}
