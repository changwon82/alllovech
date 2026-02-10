import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";

export const metadata = { title: "관리자 — All Love Church" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: memberCount },
    { count: postCount },
    { count: groupCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("groups").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "교인 수", value: memberCount ?? 0, href: "/admin/members" },
    { label: "게시글 수", value: postCount ?? 0, href: "/admin/visibility" },
    { label: "소그룹 수", value: groupCount ?? 0, href: "/admin/visibility" },
  ];

  const adminLinks = [
    {
      href: "/admin/menus",
      label: "메뉴 관리",
      desc: "공개 사이트 상단 메뉴(대메뉴·그룹·소메뉴)를 편집합니다.",
    },
    {
      href: "/admin/organizations",
      label: "조직 관리",
      desc: "소그룹/부서/예배 조직을 관리하고 리더를 지정합니다.",
    },
    {
      href: "/admin/visibility",
      label: "콘텐츠 공개 관리",
      desc: "랜딩페이지에 노출할 콘텐츠를 관리합니다.",
    },
    {
      href: "/admin/members",
      label: "교인 관리",
      desc: "교인 목록 및 역할(관리자/멤버)을 관리합니다.",
    },
    {
      href: "/admin/banners",
      label: "배너 관리",
      desc: "웰컴 페이지 메인 비주얼(히어로)과 행사 광고 배너를 관리합니다.",
    },
  ];

  return (
    <Container as="main" size="lg" className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">관리자 대시보드</h1>

      {/* 통계 카드 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {stat.label}
            </p>
            <p className="mt-1 text-3xl font-bold">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* 관리 메뉴 */}
      <div className="mt-8 space-y-4">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group block rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h2 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
              {link.label} →
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {link.desc}
            </p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
