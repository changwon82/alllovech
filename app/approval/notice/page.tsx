import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import Link from "next/link";
import LoginForm from "@/app/login/LoginForm";

export default async function ApprovalNoticePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const perPage = 10;

  const { supabase, user } = await getSessionUser();

  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  // 공지글은 항상 상단에 표시 (페이지와 무관)
  const [{ data: noticePosts }, { data: normalPosts, count }] = await Promise.all([
    supabase
      .from("approval_notice_posts")
      .select("id, title, post_date, hit_count, is_notice, author, approval_notice_files(file_name)")
      .eq("is_notice", true)
      .order("notice_order", { ascending: true })
      .order("id", { ascending: false }),
    supabase
      .from("approval_notice_posts")
      .select("id, title, post_date, hit_count, is_notice, author, approval_notice_files(file_name)", { count: "exact" })
      .or("is_notice.is.null,is_notice.eq.false")
      .order("post_date", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1),
  ]);

  const posts = [...(noticePosts || []), ...(normalPosts || [])];
  const normalCount = count || 0;
  const normalStartNum = normalCount - (page - 1) * perPage;

  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <>
    <SubpageHeader title="교회재정" breadcrumbs={[{ label: "교회재정", href: "/approval" }, { label: "재정공지" }]} />
    <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
      <SubpageSidebar
        title="교회재정"
        items={[
          { label: "재정청구", href: "/approval" },
          { label: "재정공지", href: "/approval/notice" },
          { label: "기부금영수증", href: "/approval/donation" },
        ]}
      />
      <div className="min-w-0 flex-1">
      <PageHeader title="재정공지" />

      {!user ? (
        <div className="mx-auto mt-12 max-w-sm">
          <p className="mb-6 text-center text-sm text-neutral-500">재정공지는 교인 전용 서비스입니다.</p>
          <LoginForm next="/approval/notice" />
        </div>
      ) : (<>

      <div className="flex items-center justify-end">
        {isAdmin && (
          <Link
            href="/approval/notice/new"
            className="rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            + 글쓰기
          </Link>
        )}
      </div>

      {!posts || posts.length === 0 ? (
        <p className="mt-12 text-center text-sm text-neutral-400">
          등록된 공지가 없습니다.
        </p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="w-16 py-3 text-center font-medium">번호</th>
              <th className="py-3 text-left font-medium">제목</th>
              <th className="hidden w-20 py-3 text-center font-medium md:table-cell">글쓴이</th>
              <th className="hidden w-16 py-3 text-center font-medium md:table-cell">조회</th>
              <th className="w-24 py-3 text-center font-medium">날짜</th>
            </tr>
          </thead>
          <tbody>
            {(() => { let normalIdx = 0; return posts.map((post) => {
              const rowNum = post.is_notice ? null : normalStartNum - normalIdx++;
              return (
              <tr key={post.id} className={`border-b border-neutral-100 ${post.is_notice ? "bg-neutral-50" : ""}`}>
                <td className="py-2.5 text-center text-neutral-400">
                  {post.is_notice ? (
                    <span className="rounded bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">공지</span>
                  ) : (
                    rowNum
                  )}
                </td>
                <td className="py-2.5">
                  <Link href={`/approval/notice/${post.id}`} className={`font-semibold transition hover:text-navy ${post.is_notice ? "text-neutral-900" : "text-neutral-800"}`}>
                    {post.title}
                  </Link>
                  {post.approval_notice_files?.some((f: { file_name: string }) => !/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f.file_name)) && (
                    <span className="ml-1.5 inline-block translate-y-[-1px] text-amber-500" title="첨부파일">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="inline h-4 w-4">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                      </svg>
                    </span>
                  )}
                </td>
                <td className="hidden py-2.5 text-center text-neutral-400 md:table-cell">{post.author ?? "다애교회"}</td>
                <td className="hidden py-2.5 text-center text-neutral-400 md:table-cell">{post.hit_count}</td>
                <td className="whitespace-nowrap py-2.5 text-center text-neutral-400">
                  {new Date(post.post_date).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, "-").replace(".", "")}
                </td>
              </tr>
              ); })})()}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (() => {
        const baseHref = (p: number) => `/approval/notice?page=${p}`;
        const pages: number[] = [];
        const start = Math.max(1, page - 2);
        const end = Math.min(totalPages, page + 2);
        for (let i = start; i <= end; i++) pages.push(i);

        const linkClass = "flex h-8 w-8 items-center justify-center rounded-lg text-sm text-neutral-500 hover:bg-neutral-100";
        const navClass = "rounded-lg px-2 py-1.5 text-xs text-neutral-400 hover:bg-neutral-100";

        return (
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              {pages[0] > 1 && (
                <>
                  <a href={baseHref(1)} className={linkClass}>1</a>
                  {pages[0] > 2 && <span className="px-1 text-xs text-neutral-300">···</span>}
                </>
              )}
              {pages.map((p) => (
                <a key={p} href={baseHref(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                    p === page ? "bg-navy font-bold text-white" : "text-neutral-500 hover:bg-neutral-100"
                  }`}>
                  {p}
                </a>
              ))}
              {pages[pages.length - 1] < totalPages && (
                <>
                  {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-xs text-neutral-300">···</span>}
                  <a href={baseHref(totalPages)} className={linkClass}>{totalPages}</a>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <a href={baseHref(1)} className={`${navClass} ${page === 1 ? "pointer-events-none opacity-30" : ""}`}>처음</a>
              <a href={baseHref(Math.max(1, page - 1))} className={`${navClass} ${page === 1 ? "pointer-events-none opacity-30" : ""}`}>‹ 이전</a>
              <a href={baseHref(Math.min(totalPages, page + 1))} className={`${navClass} ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}>다음 ›</a>
              <a href={baseHref(totalPages)} className={`${navClass} ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}>마지막</a>
            </div>
          </div>
        );
      })()}

    </>)}
    </div>
    </div>
    </>
  );
}
