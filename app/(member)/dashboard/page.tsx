import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";

export const metadata = { title: "대시보드 — alllovech" };

const quickLinks = [
  {
    href: "/community",
    label: "커뮤니티",
    desc: "나눔과 기도제목",
    icon: "💬",
  },
  { href: "/groups", label: "소그룹", desc: "셀 모임 관리", icon: "👥" },
  { href: "/giving", label: "헌금", desc: "헌금 내역 확인", icon: "💝" },
  { href: "/directory", label: "명부", desc: "교인 연락처", icon: "📋" },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Container as="main" size="lg" className="py-8 sm:py-12">
      {/* 인사 */}
      <h1 className="text-2xl font-bold sm:text-3xl">
        안녕하세요{profile?.name ? `, ${profile.name}` : ""} 👋
      </h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        alllovech 교인 페이지입니다.
      </p>

      {/* 빠른 링크 */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md sm:p-5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span className="text-2xl">{link.icon}</span>
            <h2 className="mt-2 font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
              {link.label}
            </h2>
            <p className="mt-0.5 text-sm text-neutral-400 dark:text-neutral-500">
              {link.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* 최근 글 */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 커뮤니티 글</h2>
          <Link
            href="/community"
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            전체 보기 →
          </Link>
        </div>

        {!recentPosts || recentPosts.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400 dark:text-neutral-500">
            아직 작성된 글이 없습니다.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/community/${post.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <span className="text-sm font-medium">{post.title}</span>
                  <time className="text-xs text-neutral-400 dark:text-neutral-500">
                    {new Date(post.created_at).toLocaleDateString("ko-KR")}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
