export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="h-7 w-12 animate-pulse rounded bg-neutral-200" />
            <div className="mt-1 h-3 w-16 animate-pulse rounded bg-neutral-100" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
    </div>
  );
}
