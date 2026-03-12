export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20">
      <div className="mt-2 h-8 w-28 animate-pulse rounded bg-neutral-200" />
      <div className="mt-2 h-1 w-12 rounded-full bg-accent" />
      <div className="mt-6 space-y-3">
        <div className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    </div>
  );
}
