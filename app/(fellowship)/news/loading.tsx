export default function Loading() {
  return (
    <>
      <div className="h-8 w-32 animate-pulse rounded bg-neutral-200" />
      <div className="mt-1 h-1 w-12 rounded-full bg-accent" />
      <div className="mt-6 space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
    </>
  );
}
