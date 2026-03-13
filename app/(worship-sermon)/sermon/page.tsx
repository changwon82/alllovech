import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import SearchBar from "./SearchBar";
import CategoryManager from "./CategoryManager";
import { AddSermonButton } from "./SermonAdmin";
import SermonContent from "./SermonContent";
import Link from "next/link";

export default async function SermonPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; q?: string; play?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || "전체";
  const page = parseInt(params.page || "1", 10);
  const q = params.q?.trim() || "";
  const playId = params.play ? parseInt(params.play, 10) : null;
  const perPage = 12;

  const { supabase, user } = await getSessionUser();

  // 관리자 확인
  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  // 카테고리 목록 (DB)
  const { data: categoryRows } = await supabase
    .from("sermon_categories")
    .select("id, name, sort_order")
    .order("sort_order");
  const categories = categoryRows || [];
  const categoryNames = categories.map((c) => c.name);

  // 히어로: play 파라미터가 있으면 해당 설교, 없으면 주일예배 최신
  let featured = null;
  if (playId) {
    const { data: playSermon } = await supabase
      .from("sermons")
      .select("id, title, preacher, sermon_date, scripture, category, youtube_url")
      .eq("id", playId)
      .single();
    featured = playSermon ?? null;
  } else if (!q) {
    const { data: featuredList } = await supabase
      .from("sermons")
      .select("id, title, preacher, sermon_date, scripture, category, youtube_url")
      .eq("category", "주일예배")
      .order("sermon_date", { ascending: false })
      .limit(1);
    featured = featuredList?.[0] ?? null;
  }

  // 목록 쿼리
  let query = supabase
    .from("sermons")
    .select("id, title, preacher, sermon_date, scripture, category, youtube_url", { count: "exact" })
    .order("sermon_date", { ascending: false });

  if (category !== "전체") query = query.eq("category", category);
  if (q) {
    query = query.or(
      `title.ilike.%${q}%,scripture.ilike.%${q}%,preacher.ilike.%${q}%`,
    );
  }
  query = query.range((page - 1) * perPage, page * perPage - 1);

  const { data: sermons, count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);
  const rest = sermons || [];

  return (
    <>
          <SermonContent
            featured={featured}
            sermons={rest}
            isAdmin={isAdmin}
            adminSlot={
              <>
                {isAdmin && (
                  <div className="mt-6 flex justify-end">
                    <AddSermonButton categories={categoryNames} />
                  </div>
                )}

                {/* 카테고리 필터 */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href="/sermon"
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      category === "전체"
                        ? "bg-navy text-white"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                    }`}
                  >
                    전체
                  </Link>
                  {categoryNames.map((cat) => (
                    <Link
                      key={cat}
                      href={`/sermon?category=${encodeURIComponent(cat)}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        category === cat
                          ? "bg-navy text-white"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                      }`}
                    >
                      {cat}
                    </Link>
                  ))}
                  {isAdmin && <CategoryManager categories={categories} />}
                </div>

                {/* 검색 중 표시 */}
                {q && (
                  <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
                    <span>&ldquo;{q}&rdquo; 검색결과 {count || 0}건</span>
                    <a
                      href={category === "전체" ? "/sermon" : `/sermon?category=${encodeURIComponent(category)}`}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-navy transition hover:bg-navy/10"
                    >
                      초기화
                    </a>
                  </div>
                )}
              </>
            }
          />

          {/* 페이지네이션 */}
          {totalPages > 1 && (() => {
            const p_params = new URLSearchParams();
            if (category !== "전체") p_params.set("category", category);
            if (q) p_params.set("q", q);
            const baseParams = p_params.toString();
            const pageUrl = (p: number) => {
              const sep = baseParams ? `${baseParams}&` : "";
              return `/sermon?${sep}page=${p}`;
            };
            const maxVisible = 5;
            let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
            const endPage = Math.min(totalPages, startPage + maxVisible - 1);
            if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
            const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

            return (
              <div className="mt-8 flex items-center justify-center gap-1">
                {page > 1 && (
                  <Link href={pageUrl(page - 1)} className="rounded-lg px-3 py-2 text-sm text-neutral-400 transition hover:bg-neutral-100">
                    ‹
                  </Link>
                )}
                {startPage > 1 && (
                  <>
                    <Link href={pageUrl(1)} className="rounded-lg px-3 py-2 text-sm text-neutral-500 transition hover:bg-neutral-100">1</Link>
                    {startPage > 2 && <span className="px-1 text-neutral-300">…</span>}
                  </>
                )}
                {pages.map((p) => (
                  <Link
                    key={p}
                    href={pageUrl(p)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      p === page
                        ? "bg-navy text-white"
                        : "text-neutral-500 hover:bg-neutral-100"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && <span className="px-1 text-neutral-300">…</span>}
                    <Link href={pageUrl(totalPages)} className="rounded-lg px-3 py-2 text-sm text-neutral-500 transition hover:bg-neutral-100">{totalPages}</Link>
                  </>
                )}
                {page < totalPages && (
                  <Link href={pageUrl(page + 1)} className="rounded-lg px-3 py-2 text-sm text-neutral-400 transition hover:bg-neutral-100">
                    ›
                  </Link>
                )}
              </div>
            );
          })()}

          {/* 검색 */}
          <SearchBar category={category} defaultValue={q} />
    </>
  );
}
