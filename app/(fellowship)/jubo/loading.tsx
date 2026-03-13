export default function Loading() {
  return (
    <>
      <div className="h-8 w-24 animate-pulse rounded bg-neutral-200" />
      <div className="mt-1 h-1 w-12 rounded-full bg-accent" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-neutral-100">
            <div className="aspect-[3/4] rounded-t-2xl bg-neutral-200" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-3/4 rounded bg-neutral-200" />
              <div className="h-3 w-1/2 rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
