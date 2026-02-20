export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20">
      <div className="mt-2 h-8 w-40 animate-pulse rounded bg-neutral-200" />
      <div className="mt-2 h-1 w-12 rounded bg-blue" />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
