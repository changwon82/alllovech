export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20">
      <div className="mt-2 h-4 w-20 animate-pulse rounded bg-neutral-100" />
      <div className="mt-1 h-8 w-36 animate-pulse rounded bg-neutral-200" />
      <div className="mt-2 h-1 w-12 rounded bg-blue" />
      <div className="mt-6 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100" />
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-100" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
