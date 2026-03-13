export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-20 md:px-8">
      {/* 히어로 슬라이더 */}
      <div className="h-[400px] w-full animate-pulse rounded-2xl bg-neutral-100" />

      {/* 섹션들 */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="h-7 w-32 animate-pulse rounded bg-neutral-200" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-7 w-32 animate-pulse rounded bg-neutral-200" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
