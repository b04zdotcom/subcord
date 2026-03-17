export function MessageSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-discord-hover flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex gap-2 items-center">
          <div className="h-3 w-24 bg-discord-hover rounded" />
          <div className="h-3 w-12 bg-discord-hover rounded" />
        </div>
        <div className="h-3 bg-discord-hover rounded w-3/4" />
        <div className="h-3 bg-discord-hover rounded w-1/2" />
      </div>
    </div>
  );
}

export function MessageSkeletonList() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  );
}
