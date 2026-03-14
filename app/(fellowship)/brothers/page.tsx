import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import BoardSearch from "@/app/components/ui/BoardSearch";
import HighlightText from "@/app/components/ui/HighlightText";
import Link from "next/link";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function excerpt(html: string, term: string, len = 200): string {
  const text = stripHtml(html);
  if (!term) return text.slice(0, len);
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text.slice(0, len);
  const start = Math.max(0, idx - 40);
  return (start > 0 ? "..." : "") + text.slice(start, start + len);
}

export default async function BrothersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sf?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const q = params.q?.trim() || "";
  const sf = params.sf || "both";
  const perPage = 10;

  const { supabase, user } = await getSessionUser();

  // 관리자 확인
  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  let query = supabase
    .from("brothers_posts")
    .select("id, title, post_date, hit_count, content", { count: "exact" })
    .order("post_date", { ascending: false })
    .order("id", { ascending: false });

  if (q) {
    const term = `%${q}%`;
    const re = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (sf === "title") query = query.ilike("title", term);
    else if (sf === "content") query = query.ilike("content", term);
    else query = query.or(`title.imatch.${re},content.imatch.${re}`);
  }

  const { data: posts, count } = await query.range((page - 1) * perPage, page * perPage - 1);

  const totalPages = Math.ceil((count || 0) / perPage);


  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="교우소식" />
        {isAdmin && (
          <Link
            href="/brothers/new"
            className="rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            + 글쓰기
          </Link>
        )}
      </div>

      {q && (
        <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
          <span>&ldquo;{q}&rdquo; 검색결과 {count || 0}건</span>
          <a href="/brothers" className="rounded-lg px-2 py-1 text-xs font-medium text-navy transition hover:bg-navy/10">초기화</a>
        </div>
      )}

      {!posts || posts.length === 0 ? (
        <p className="mt-12 text-center text-sm text-neutral-400">
          {q ? "검색 결과가 없습니다." : "등록된 소식이 없습니다."}
        </p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="w-28 whitespace-nowrap py-3 pr-4 text-left font-medium">날짜</th>
              <th className="py-3 text-left font-medium">제목</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-neutral-100">
                <td className="whitespace-nowrap py-2.5 pr-4 align-top text-neutral-400">
                  {new Date(post.post_date).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, "-").replace(".", "")}
                </td>
                <td className="py-2.5">
                  <Link href={q ? `/brothers/${post.id}?q=${encodeURIComponent(q)}` : `/brothers/${post.id}`} className="line-clamp-1 font-semibold text-neutral-800 transition hover:text-navy md:line-clamp-none">
                    {q ? <HighlightText text={post.title} highlight={q} /> : post.title}
                  </Link>
                  {q && post.content && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">
                      <HighlightText text={excerpt(post.content, q)} highlight={q} />
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (() => {
        const sp = new URLSearchParams();
        if (q) { sp.set("q", q); sp.set("sf", sf); }
        const baseHref = (p: number) => { sp.set("page", String(p)); return `/brothers?${sp.toString()}`; };
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

      <BoardSearch table="brothers_posts" basePath="/brothers" defaultValue={q} defaultField={sf as any} />
    </>
  );
}
