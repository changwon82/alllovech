import { getSessionUser } from "@/lib/supabase/server";
import PageHeader from "@/app/components/ui/PageHeader";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import Link from "next/link";

const R2_BASE = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/jubo";

export default async function JuboPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const perPage = 16;

  const { supabase } = await getSessionUser();

  const { data: posts, count } = await supabase
    .from("jubo_posts")
    .select("id, title, content, post_date, hit_count, jubo_images(file_name, sort_order)", { count: "exact" })
    .order("post_date", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const totalPages = Math.ceil((count || 0) / perPage);

  function getThumb(post: any): string | undefined {
    const images = post.jubo_images as { file_name: string }[];
    const imgFile = images?.find((img) => /\.(jpg|jpeg|png|gif|webp)$/i.test(img.file_name));
    if (imgFile) return imgFile.file_name;
    if (post.content) {
      const match = post.content.match(/src=["']+([^"']+\.(?:jpg|jpeg|png|gif|webp))["']+/i);
      if (match) return match[1].split("/").pop();
    }
    return undefined;
  }

  return (
    <>
    <SubpageHeader title="교제와 소식" breadcrumbs={[{ label: "교제와 소식", href: "/news" }, { label: "주보" }]} />
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
      <PageHeader title="주보" />

      {!posts || posts.length === 0 ? (
        <p className="mt-12 text-center text-sm text-neutral-400">
          등록된 주보가 없습니다.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {posts.map((post) => {
            const thumb = getThumb(post);
            return (
              <Link
                key={post.id}
                href={`/jubo/${post.id}`}
                className="group relative overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {thumb ? (
                  <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
                    <img
                      src={`${R2_BASE}/${thumb}`}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-neutral-100">
                    <span className="text-3xl text-neutral-300">📋</span>
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
        const baseHref = (p: number) => `/jubo?page=${p}`;
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

    </div>
    </div>
    </>
  );
}
