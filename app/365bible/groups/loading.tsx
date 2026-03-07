export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20">
      <div className="mt-2 h-8 w-32 animate-pulse rounded bg-neutral-200" />
      <div className="mt-2 h-1 w-12 rounded-full bg-accent" />
      <div className="mt-6 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
            {/* 헤더: 뱃지 + 그룹명 + 인원 */}
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-10 animate-pulse rounded-full bg-neutral-100" />
              <div className="h-5 w-20 animate-pulse rounded bg-neutral-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-50" />
            </div>
            <div className="mt-3 space-y-3 pt-3">
              {/* Day 네비게이션 바 */}
              <div className="h-9 w-full animate-pulse rounded-full bg-neutral-200" />
              {/* 아바타 행 */}
              <div className="flex justify-center gap-0 pt-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex flex-col items-center gap-1" style={{ width: 64, marginLeft: j > 1 ? -6 : 0 }}>
                    <div className="h-14 w-14 animate-pulse rounded-full bg-neutral-100" />
                    <div className="h-3 w-10 animate-pulse rounded bg-neutral-100" />
                    <div className="h-3 w-8 animate-pulse rounded bg-neutral-50" />
                  </div>
                ))}
              </div>
              {/* 묵상 버튼 */}
              <div className="mx-auto h-8 w-32 animate-pulse rounded-xl bg-neutral-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
