import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  const posts = data ?? [];

  return (
    <div className="min-h-screen">
      {/* ── 네비게이션 ── */}
      <nav className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            alllovech
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {user.email}
              </span>
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-neutral-900 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              로그인
            </Link>
          )}
        </div>
      </nav>

      {/* ── 히어로 영역 ── */}
      <header className="mx-auto max-w-3xl px-6 pt-16 pb-10">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Posts
        </h1>
        <p className="mt-3 text-lg text-neutral-500 dark:text-neutral-400">
          최근 작성된 글을 확인해 보세요.
        </p>
      </header>

      {/* ── 콘텐츠 ── */}
      <main className="mx-auto max-w-3xl px-6 pb-24">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              데이터를 불러오는 중 오류가 발생했습니다.
            </p>
            <pre className="mt-3 overflow-auto text-xs text-red-500">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-20 dark:border-neutral-700">
            <p className="text-neutral-400 dark:text-neutral-500">
              아직 작성된 글이 없습니다.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {posts.map((p) => (
              <li
                key={p.id}
                className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <h2 className="text-lg font-semibold leading-snug group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                  {p.title}
                </h2>
                <time className="mt-2 block text-sm text-neutral-400 dark:text-neutral-500">
                  {new Date(p.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
