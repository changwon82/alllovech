export default function Loading() {
  return (
    <>
      <div className="h-8 w-32 animate-pulse rounded bg-neutral-200" />
      <div className="mt-1 h-1 w-12 rounded-full bg-accent" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    </>
  );
}
