export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20">
      <div className="mt-2 h-8 w-40 animate-pulse rounded bg-neutral-200" />
      <div className="mt-2 h-1 w-12 rounded-full bg-accent" />
      {/* 2x2 기간 카드 */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="h-3 w-8 animate-pulse rounded bg-neutral-100" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-neutral-100" />
            <div className="mt-1 h-3 w-12 animate-pulse rounded bg-neutral-100" />
          </div>
        ))}
      </div>
      {/* 정보 라인 */}
      <div className="mt-4 flex justify-center">
        <div className="h-4 w-40 animate-pulse rounded bg-neutral-100" />
      </div>
      {/* 그룹 카드 */}
      <div className="mt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="h-5 w-32 animate-pulse rounded bg-neutral-100" />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j}>
                  <div className="h-3 w-6 animate-pulse rounded bg-neutral-100" />
                  <div className="mt-1 h-4 w-10 animate-pulse rounded bg-neutral-100" />
                  <div className="mt-1 h-1.5 w-full animate-pulse rounded-full bg-neutral-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
