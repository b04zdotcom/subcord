export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-discord-primary">
      {children}
    </div>
  );
}
