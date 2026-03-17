import { MessageSquare, AlertTriangle } from "lucide-react";

interface Props {
  type: "no-selection" | "no-messages" | "error";
  error?: string | null;
  hint?: string | null;
}

export function EmptyState({ type, error, hint }: Props) {
  if (type === "no-selection") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-discord-text-muted gap-3">
        <MessageSquare className="w-12 h-12 opacity-30" />
        <p className="text-sm">Select a chat from the sidebar</p>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 max-w-md mx-auto text-center">
        <AlertTriangle className="w-10 h-10 text-discord-danger opacity-70" />
        <div>
          <p className="text-discord-text-secondary text-sm font-medium mb-2">
            {error ?? "Failed to load messages"}
          </p>
          {hint && (
            <details className="text-left">
              <summary className="text-discord-text-muted text-xs cursor-pointer hover:text-discord-text-secondary">
                How to fix this
              </summary>
              <p className="text-discord-text-muted text-xs mt-2 leading-relaxed">
                {hint}
              </p>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-discord-text-muted gap-3">
      <MessageSquare className="w-10 h-10 opacity-30" />
      <p className="text-sm">No messages yet</p>
    </div>
  );
}
