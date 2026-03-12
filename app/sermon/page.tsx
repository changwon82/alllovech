import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import SubpageHeader from "@/app/components/SubpageHeader";
import SermonList from "./SermonList";
import SearchBar from "./SearchBar";
import CategoryManager from "./CategoryManager";
import { AddSermonButton } from "./SermonAdmin";
import Link from "next/link";

function getThumbnail(url: string | null): string | null {
  if (!url || url === ".") return null;
  const ytEmbed = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (ytEmbed) return `https://img.youtube.com/vi/${ytEmbed[1]}/hqdefault.jpg`;
  const ytWatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (ytWatch) return `https://img.youtube.com/vi/${ytWatch[1]}/hqdefault.jpg`;
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) return `https://img.youtube.com/vi/${ytShort[1]}/hqdefault.jpg`;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
  return null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function SermonPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || "전체";
  const page = parseInt(params.page || "1", 10);
  const q = params.q?.trim() || "";
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

  // 검색이 없을 때만 히어로 표시
  let featured = null;
  if (!q) {
    let featuredQuery = supabase
      .from("sermons")
      .select("id, title, preacher, sermon_date, scripture, category, youtube_url")
      .order("sermon_date", { ascending: false })
      .limit(1);
    if (category !== "전체") featuredQuery = featuredQuery.eq("category", category);
    const { data: featuredList } = await featuredQuery;
    featured = featuredList?.[0] ?? null;
  }

  // 목록 쿼리
  let query = supabase
    .from("sermons")
    .select("id, title, preacher, sermon_date, scripture, category, youtube_url", { count: "exact" })
    .order("sermon_date", { ascending: false });

  if (category !== "전체") query = query.eq("category", category);
  if (featured) query = query.neq("id", featured.id);
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
      <SubpageHeader
        title="예배와 말씀"
        breadcrumbs={[
          { label: "예배와 말씀", href: "/worship" },
          { label: "예배영상" },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 pb-20 md:px-8">
        {/* 최신 설교 히어로 */}
        {featured && (
          <Link
            href={`/sermon/${featured.id}`}
            className="flex flex-col overflow-hidden rounded-2xl bg-neutral-800 transition-shadow hover:shadow-xl md:flex-row"
          >
            <div className="relative aspect-video w-full shrink-0 md:w-[420px]">
              {getThumbnail(featured.youtube_url) ? (
                <img
                  src={getThumbnail(featured.youtube_url)!}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-700 text-4xl text-neutral-500">
                  🎙️
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center px-6 py-5 md:px-10 md:py-8">
              <p className="text-sm text-neutral-400">
                [{formatDate(featured.sermon_date)}] {featured.category}
              </p>
              <div className="mt-2 h-px bg-neutral-600" />
              <h2 className="mt-4 text-xl font-bold text-white md:text-2xl">
                {featured.title}
              </h2>
              <p className="mt-2 text-base text-neutral-300">
                {featured.scripture && `${featured.scripture} / `}
                {featured.preacher}
              </p>
            </div>
          </Link>
        )}

        {/* 관리자: 새 영상 등록 */}
        {isAdmin && (
          <div className="mt-6 flex justify-end">
            <AddSermonButton categories={categoryNames} />
          </div>
        )}

        {/* 카테고리 필터 */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <a
            href="/sermon"
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              category === "전체"
                ? "bg-navy text-white"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }`}
          >
            전체
          </a>
          {categoryNames.map((cat) => (
            <a
              key={cat}
              href={`/sermon?category=${encodeURIComponent(cat)}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                category === cat
                  ? "bg-navy text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              {cat}
            </a>
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

        {/* 설교 그리드 */}
        <div className="mt-6">
          <SermonList sermons={rest} isAdmin={isAdmin} categories={categoryNames} />
        </div>

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
                <a href={pageUrl(page - 1)} className="rounded-lg px-3 py-2 text-sm text-neutral-400 transition hover:bg-neutral-100">
                  ‹
                </a>
              )}
              {startPage > 1 && (
                <>
                  <a href={pageUrl(1)} className="rounded-lg px-3 py-2 text-sm text-neutral-500 transition hover:bg-neutral-100">1</a>
                  {startPage > 2 && <span className="px-1 text-neutral-300">…</span>}
                </>
              )}
              {pages.map((p) => (
                <a
                  key={p}
                  href={pageUrl(p)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    p === page
                      ? "bg-navy text-white"
                      : "text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  {p}
                </a>
              ))}
              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && <span className="px-1 text-neutral-300">…</span>}
                  <a href={pageUrl(totalPages)} className="rounded-lg px-3 py-2 text-sm text-neutral-500 transition hover:bg-neutral-100">{totalPages}</a>
                </>
              )}
              {page < totalPages && (
                <a href={pageUrl(page + 1)} className="rounded-lg px-3 py-2 text-sm text-neutral-400 transition hover:bg-neutral-100">
                  ›
                </a>
              )}
            </div>
          );
        })()}

        {/* 검색 */}
        <SearchBar category={category} defaultValue={q} />
      </div>
    </>
  );
}
