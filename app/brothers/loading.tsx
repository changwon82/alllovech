export default function Loading() {
  return (
    <>
      <div className="h-12 w-full bg-neutral-50" />
      <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
        <div className="hidden w-48 shrink-0 md:block">
          <div className="h-6 w-24 animate-pulse rounded bg-neutral-200" />
          <div className="mt-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-neutral-100" />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="h-8 w-32 animate-pulse rounded bg-neutral-200" />
          <div className="mt-1 h-1 w-12 rounded-full bg-accent" />
          <div className="mt-6 space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
