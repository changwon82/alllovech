import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="sticky top-0 z-10 -mx-4 border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            alllovech
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/about"
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              교회 소개
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-neutral-900 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              로그인
            </Link>
          </div>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </>
  );
}
