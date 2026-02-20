export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20">
      <div className="mt-2 h-8 w-32 animate-pulse rounded bg-neutral-200" />
      <div className="mt-2 h-1 w-12 rounded bg-blue" />
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-neutral-200 p-4">
            <div className="h-5 w-24 animate-pulse rounded bg-neutral-100" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
