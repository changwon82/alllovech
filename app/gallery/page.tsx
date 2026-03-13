import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import PageHeader from "@/app/components/ui/PageHeader";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import Link from "next/link";
import ThumbImage from "@/app/components/ui/ThumbImage";

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
  const perPage = 16;

  const { supabase, user } = await getSessionUser();

  // 관리자 확인
  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  // 게시글 + 첫 번째 이미지 조회
  let query = supabase
    .from("gallery_posts")
    .select("id, title, category, content, post_date, hit_count, gallery_images(file_name)", { count: "exact" })
    .eq("gallery_images.sort_order", 0)
    .order("post_date", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (category !== "전체") {
    query = query.eq("category", category);
  }

  const { data: posts, count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <>
    <SubpageHeader title="교제와 소식" breadcrumbs={[{ label: "교제와 소식", href: "/news" }, { label: "다애사진" }]} />
    <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
      <SubpageSidebar
        title="교제와 소식"
        items={[
          { label: "교회소식", href: "/news" },
          { label: "교우소식", href: "/brothers" },
          { label: "주보", href: "/jubo" },
          { label: "다애사진", href: "/gallery" },
        ]}
      />
      <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between">
        <PageHeader title="다애사진" />
        {isAdmin && (
          <Link
            href="/gallery/new"
            className="rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            + 글쓰기
          </Link>
        )}
      </div>

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
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {posts.map((post) => {
            const images = post.gallery_images as { file_name: string }[];
            const firstAttach = images?.[0]?.file_name;
            let originalUrl: string | undefined;

            if (firstAttach) {
              originalUrl = `${R2_BASE}/${firstAttach}`;
            } else if (post.content) {
              const match = post.content.match(/src=["']+([^"']+\.(?:jpg|jpeg|png|gif|webp))["']+/i);
              if (match) originalUrl = match[1];
            }

            // 썸네일 URL: _thumb을 파일명 바로 앞에 삽입
            let thumbUrl = originalUrl;
            if (originalUrl) {
              // R2 키 추출 (첨부파일 또는 content에서 추출한 URL)
              const r2Key = firstAttach || (originalUrl.startsWith(R2_BASE + "/") ? originalUrl.slice(R2_BASE.length + 1) : null);
              if (r2Key) {
                const parts = r2Key.split("/");
                const fileName = parts.pop()!;
                const thumbPath = [...parts, "_thumb", fileName].join("/");
                thumbUrl = `${R2_BASE}/${thumbPath}`;
              }
            }

            return (
              <Link
                key={post.id}
                href={`/gallery/${post.id}`}
                className="group relative overflow-hidden bg-neutral-100"
              >
                {originalUrl ? (
                  <div className="aspect-square overflow-hidden">
                    <ThumbImage
                      src={originalUrl}
                      thumbSrc={thumbUrl!}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center">
                    <span className="text-3xl text-neutral-300">📷</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2.5 py-2">
                  <p className="truncate text-xs font-medium text-white">
                    {post.title}
                  </p>
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

    </div>
    </div>
    </>
  );
}
