export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-8 md:pt-4 md:pb-12">
      <div className="mt-2 flex items-baseline gap-2">
        <h1 className="text-2xl font-bold text-navy md:text-3xl">
          365 성경읽기
        </h1>
      </div>
      <div className="mt-2 h-1 w-12 rounded bg-blue" />

      {/* Day 번호 skeleton */}
      <div className="mt-0.5 flex justify-center">
        <div className="h-10 w-28 animate-pulse rounded bg-neutral-200" />
      </div>

      {/* 날짜 네비게이션 skeleton */}
      <div className="mt-2 flex items-stretch justify-between gap-2">
        <div className="h-10 w-24 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-10 w-24 animate-pulse rounded-lg bg-neutral-100" />
      </div>

      {/* 읽기 정보 skeleton */}
      <div className="mt-4 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50 p-5 md:p-6">
        <div className="h-6 w-3/4 rounded bg-neutral-200" />
      </div>

      {/* 본문 skeleton */}
      <div className="mt-8 space-y-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="h-5 animate-pulse rounded bg-neutral-100"
            style={{ width: `${70 + (i % 3) * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}
