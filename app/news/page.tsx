import { getSessionUser } from "@/lib/supabase/server";
import PageHeader from "@/app/components/ui/PageHeader";
import BottomNav from "@/app/components/BottomNav";
import Link from "next/link";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const perPage = 36;

  const { supabase, user } = await getSessionUser();

  const { data: posts, count } = await supabase
    .from("news_posts")
    .select("id, title, content, post_date, hit_count", { count: "exact" })
    .order("post_date", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const totalPages = Math.ceil((count || 0) / perPage);

  // 관리자 여부
  let isAdmin = false;
  if (user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "ADMIN")
      .maybeSingle();
    isAdmin = !!roles;
  }

  // HTML 태그 제거하여 미리보기 텍스트 생성
  function getPreview(content: string | null): string {
    if (!content) return "";
    const text = content
      .replace(/<img[^>]*>/gi, "")
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 80 ? text.slice(0, 80) + "..." : text;
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pt-3 pb-20">
      <PageHeader title="교회소식" />

      {!posts || posts.length === 0 ? (
        <p className="mt-12 text-center text-sm text-neutral-400">
          등록된 소식이 없습니다.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/news/${post.id}`}
              className="block rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-semibold text-neutral-800 line-clamp-1">
                {post.title}
              </p>
              {post.content && (
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-400 line-clamp-2">
                  {getPreview(post.content)}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                <span>{new Date(post.post_date).toLocaleDateString("ko-KR")}</span>
                <span>·</span>
                <span>조회 {post.hit_count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (() => {
        const baseHref = (p: number) => `/news?page=${p}`;
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
                <a
                  key={p}
                  href={baseHref(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                    p === page ? "bg-navy font-bold text-white" : "text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
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

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user?.id} />
    </div>
  );
}
