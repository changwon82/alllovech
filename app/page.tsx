import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";
import { POST_CATEGORY_LABEL } from "@/src/types/database";
import type { Post, VisibilitySetting } from "@/src/types/database";
import { getProfileName } from "@/src/lib/utils";

export default async function LandingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* ── 공개 설정 조회 ── */
  const { data: visibilityData } = await supabase
    .from("visibility_settings")
    .select("*");

  const visibility: Record<string, VisibilitySetting> = {};
  (visibilityData ?? []).forEach((v: VisibilitySetting) => {
    visibility[v.section] = v;
  });

  /* ── 공개 콘텐츠 조회 ── */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let publicPosts: any[] = [];
  let publicGroups: any[] = [];

  if (visibility.community?.is_visible_on_landing) {
    const { data } = await supabase
      .from("posts")
      .select("id, title, category, created_at, profiles(name)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(visibility.community.max_items);
    publicPosts = data ?? [];
  }

  if (visibility.groups?.is_visible_on_landing) {
    const { data } = await supabase
      .from("groups")
      .select("id, name, description")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(visibility.groups.max_items);
    publicGroups = data ?? [];
  }

  return (
    <>
      {/* ── 네비게이션 ── */}
      <nav className="sticky top-0 z-10 -mx-4 border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            alllovech
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/about"
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              교회 소개
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-neutral-900 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                교인 페이지
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-neutral-900 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── 히어로 ── */}
      <Container as="header" className="py-16 text-center sm:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          alllovech
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-neutral-500 dark:text-neutral-400">
          모든 사랑의 교회에 오신 것을 환영합니다.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/about"
            className="rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            교회 소개
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="rounded-full border border-neutral-300 px-8 py-3 text-sm font-semibold transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {user ? "교인 페이지" : "로그인"}
          </Link>
        </div>
      </Container>

      {/* ── 예배 안내 ── */}
      <Container className="pb-12 sm:pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "주일 예배", time: "매주 일요일 오전 11:00" },
            { title: "수요 예배", time: "매주 수요일 오후 7:30" },
            { title: "금요 기도회", time: "매주 금요일 오후 9:00" },
          ].map((service) => (
            <div
              key={service.title}
              className="rounded-xl border border-neutral-200 bg-white p-5 text-center dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="font-semibold">{service.title}</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {service.time}
              </p>
            </div>
          ))}
        </div>
      </Container>

      {/* ── 공개 커뮤니티 글 ── */}
      {publicPosts.length > 0 && (
        <Container className="pb-12 sm:pb-16">
          <h2 className="text-xl font-bold sm:text-2xl">소식</h2>
          <ul className="mt-4 space-y-3">
            {publicPosts.map((post) => (
              <li
                key={post.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{post.title}</h3>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {POST_CATEGORY_LABEL[
                      post.category as Post["category"]
                    ] ?? post.category}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500">
                  <span>{getProfileName(post.profiles)}</span>
                  <span>·</span>
                  <time>
                    {new Date(post.created_at).toLocaleDateString("ko-KR")}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ── 공개 소그룹 ── */}
      {publicGroups.length > 0 && (
        <Container className="pb-12 sm:pb-16">
          <h2 className="text-xl font-bold sm:text-2xl">소그룹</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {publicGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <h3 className="font-semibold">{group.name}</h3>
                {group.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {group.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* ── 푸터 ── */}
      <footer className="mt-auto border-t border-neutral-200 py-8 text-center text-sm text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
        &copy; {new Date().getFullYear()} alllovech. All rights reserved.
      </footer>
    </>
  );
}
