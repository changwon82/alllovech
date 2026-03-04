export default function Loading() {
  return (
    <div>
      <div className="h-6 w-24 animate-pulse rounded bg-neutral-200" />
      <div className="mt-1 h-1 w-10 rounded-full bg-neutral-200" />

      <div className="mt-6 grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="h-8 w-14 animate-pulse rounded bg-neutral-200" />
            <div className="mt-2 h-4 w-20 animate-pulse rounded bg-neutral-100" />
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
    </div>
  );
}
