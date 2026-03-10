import { getSessionUser } from "@/lib/supabase/server";
import PageHeader from "@/app/components/ui/PageHeader";
import BottomNav from "@/app/components/BottomNav";
import Link from "next/link";

const R2_BASE = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/gallery";

const CATEGORIES = ["전체", "예배", "교회학교", "행사", "건축", "기타"];

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || "전체";
  const page = parseInt(params.page || "1", 10);
  const perPage = 12;

  const { supabase, user } = await getSessionUser();

  // 게시글 + 첫 번째 이미지 조회
  let query = supabase
    .from("gallery_posts")
    .select("id, title, category, content, post_date, hit_count, gallery_images(file_name)", { count: "exact" })
    .eq("gallery_images.sort_order", 0)
    .order("post_date", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (category !== "전체") {
    query = query.eq("category", category);
  }

  const { data: posts, count } = await query;
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

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20">
      <PageHeader title="사진갤러리" />

      {/* 카테고리 필터 */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={cat === "전체" ? "/gallery" : `/gallery?category=${encodeURIComponent(cat)}`}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              category === cat
                ? "bg-navy text-white"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }`}
          >
            {cat}
          </a>
        ))}
      </div>

      {/* 갤러리 그리드 */}
      {!posts || posts.length === 0 ? (
        <p className="mt-12 text-center text-sm text-neutral-400">
          등록된 사진이 없습니다.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {posts.map((post) => {
            const images = post.gallery_images as { file_name: string }[];
            let thumb = images?.[0]?.file_name;

            // 첨부파일 없으면 content HTML에서 첫 이미지 추출
            if (!thumb && post.content) {
              const match = post.content.match(/src=["']+([^"']+\.(?:jpg|jpeg|png|gif|webp))["']+/i);
              if (match) thumb = match[1].split("/").pop() || undefined;
            }

            return (
              <Link
                key={post.id}
                href={`/gallery/${post.id}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {thumb ? (
                  <div className="aspect-square overflow-hidden bg-neutral-100">
                    <img
                      src={`${R2_BASE}/${thumb}`}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-neutral-100">
                    <span className="text-3xl text-neutral-300">📷</span>
                  </div>
                )}
                <div className="p-2.5">
                  <p className="truncate text-sm font-semibold text-neutral-800">
                    {post.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                    <span>{new Date(post.post_date).toLocaleDateString("ko-KR")}</span>
                    <span>·</span>
                    <span className="text-accent">{post.category}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (() => {
        const baseHref = (p: number) =>
          `/gallery?category=${encodeURIComponent(category)}&page=${p}`;

        // 현재 페이지 기준 앞뒤 2페이지씩 표시
        const pages: number[] = [];
        const start = Math.max(1, page - 2);
        const end = Math.min(totalPages, page + 2);
        for (let i = start; i <= end; i++) pages.push(i);

        const linkClass = "flex h-8 w-8 items-center justify-center rounded-lg text-sm text-neutral-500 hover:bg-neutral-100";
        const navClass = "rounded-lg px-2 py-1.5 text-xs text-neutral-400 hover:bg-neutral-100";

        return (
          <div className="mt-6 flex flex-col items-center gap-2">
            {/* 페이지 번호 */}
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
                    p === page
                      ? "bg-navy font-bold text-white"
                      : "text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  {p}
                </a>
              ))}
              {pages[pages.length - 1] < totalPages && (
                <>
                  {pages[pages.length - 1] < totalPages - 1 && (
                    <span className="px-1 text-xs text-neutral-300">···</span>
                  )}
                  <a href={baseHref(totalPages)} className={linkClass}>{totalPages}</a>
                </>
              )}
            </div>

            {/* 이전/다음 + 처음/마지막 */}
            <div className="flex items-center gap-3">
              <a href={baseHref(1)} className={`${navClass} ${page === 1 ? "pointer-events-none opacity-30" : ""}`}>
                처음
              </a>
              <a href={baseHref(Math.max(1, page - 1))} className={`${navClass} ${page === 1 ? "pointer-events-none opacity-30" : ""}`}>
                ‹ 이전
              </a>
              <a href={baseHref(Math.min(totalPages, page + 1))} className={`${navClass} ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}>
                다음 ›
              </a>
              <a href={baseHref(totalPages)} className={`${navClass} ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}>
                마지막
              </a>
            </div>
          </div>
        );
      })()}

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user?.id} />
    </div>
  );
}
