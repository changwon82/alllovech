export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20">
      {/* 헤더 */}
      <div className="mt-2 flex items-center justify-between">
        <div className="h-8 w-36 animate-pulse rounded bg-neutral-200" />
        <div className="h-6 w-16 animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="mt-2 h-1 w-12 rounded-full bg-accent" />

      {/* Day 네비게이션 */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100" />
        <div className="h-7 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100" />
      </div>

      {/* 유튜브 영역 */}
      <div className="mt-4 aspect-video w-full animate-pulse rounded-2xl bg-neutral-100" />

      {/* 본문 영역 */}
      <div className="mt-5 space-y-2.5">
        <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-neutral-100" style={{ width: `${85 - i * 5}%` }} />
        ))}
      </div>
    </div>
  );
}
