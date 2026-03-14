import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import Link from "next/link";
import GalleryImageList from "./GalleryImageList";
import PageHeader from "@/app/components/ui/PageHeader";
import DeleteButton from "./DeleteButton";
import PostContent from "@/app/components/ui/PostContent";
import HighlightText from "@/app/components/ui/HighlightText";

const R2_BASE = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/gallery";

export default async function GalleryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  const highlight = q?.trim() || "";
  const { supabase, user } = await getSessionUser();

  // 관리자 확인
  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  const [{ data: post }, { data: images }] = await Promise.all([
    supabase
      .from("gallery_posts")
      .select("*")
      .eq("id", parseInt(id, 10))
      .single(),
    supabase
      .from("gallery_images")
      .select("file_name, original_name, sort_order")
      .eq("post_id", parseInt(id, 10))
      .order("sort_order"),
  ]);

  if (!post) notFound();

  // 첨부파일 이미지 (full URL) — content 인라인 이미지와 별도
  const attachImageUrls = (images || []).map((img) => `${R2_BASE}/${img.file_name}`);

  return (
    <>
      <PageHeader title="다애사진" />
      {/* 관리자 버튼 */}
      {isAdmin && (
        <div className="mt-6 flex items-center justify-end gap-2">
          <Link
            href={`/gallery/${post.id}/edit`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-navy transition-all hover:bg-navy/10 active:scale-95"
          >
            수정
          </Link>
          <DeleteButton postId={post.id} />
        </div>
      )}

      {/* 제목 바 */}
      <div className={isAdmin ? "mt-2" : "mt-6"}>
        <div className="flex items-center gap-2.5 border-y border-neutral-200 bg-neutral-50 px-5 py-3">
          <span className="shrink-0 rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-medium text-navy">
            {post.category}
          </span>
          <h1 className="flex-1 text-[15px] font-bold text-neutral-800"><HighlightText text={post.title} highlight={highlight} /></h1>
          <span className="shrink-0 text-xs text-neutral-400">
            {new Date(post.post_date).toLocaleDateString("ko-KR")}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-2.5 text-xs text-neutral-400">
          <span>{post.author ?? "다애교회"}</span>
          <span>조회수 &nbsp;{post.hit_count}</span>
        </div>
      </div>

      {/* 본문 — 원본 HTML 그대로 렌더링 */}
      {post.content && (
        <PostContent
          html={post.content}
          className="post-content mt-6 px-4 text-sm leading-relaxed text-neutral-600"
          highlight={highlight}
        />
      )}

      {/* 첨부파일 이미지 */}
      {attachImageUrls.length > 0 && (
        <div className="mt-6 px-4">
          <GalleryImageList
            images={attachImageUrls}
            title={post.title}
          />
        </div>
      )}

      {/* 목록으로 */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/gallery"
          className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          목록으로
        </Link>
      </div>

      <style>{`
        .post-content img {
          width: 100%;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
          cursor: pointer;
        }
        .post-content iframe {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        .post-content p {
          margin: 0.25rem 0;
        }
      `}</style>
    </>
  );
}
