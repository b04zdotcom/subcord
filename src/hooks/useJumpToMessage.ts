"use client";
import { useRef, useCallback } from "react";

export function useJumpToMessage() {
  const refs = useRef<Map<string, HTMLElement>>(new Map());

  const registerRef = useCallback(
    (id: string, el: HTMLElement | null) => {
      if (el) {
        refs.current.set(id, el);
      } else {
        refs.current.delete(id);
      }
    },
    []
  );

  const jumpTo = useCallback((messageId: string) => {
    const el = refs.current.get(messageId);
    if (!el) return false;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("message-highlight");
    setTimeout(() => {
      el.classList.remove("message-highlight");
    }, 2500);

    return true;
  }, []);

  return { registerRef, jumpTo };
}
