import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import Link from "next/link";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import GalleryImageList from "./GalleryImageList";
import PageHeader from "@/app/components/ui/PageHeader";
import DeleteButton from "./DeleteButton";

const R2_BASE = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/gallery";

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // content에서 이미지 URL 추출 (구 게시판 이미지)
  const contentImageUrls: string[] = [];
  if (post.content) {
    // src="...", src='...', src=''...'' 등 다양한 형태 처리
    const regex = /src=["']+([^"']+)["']+/g;
    let match;
    while ((match = regex.exec(post.content)) !== null) {
      const url = match[1];
      // 이미지 확장자만 필터
      if (!/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url)) continue;
      contentImageUrls.push(url);
    }
  }

  // 첨부파일 이미지 (full URL)
  const attachImageUrls = (images || []).map((img) => `${R2_BASE}/${img.file_name}`);

  // 합치기 (첨부파일 우선, 중복 제거)
  const allImages = [...new Set([...attachImageUrls, ...contentImageUrls])];

  return (
    <>
    <SubpageHeader
      title="교제와 소식"
      breadcrumbs={[
        { label: "교제와 소식", href: "/news" },
        { label: "다애사진", href: "/gallery" },
      ]}
    />
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
          <h1 className="flex-1 text-[15px] font-bold text-neutral-800">{post.title}</h1>
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
        <div
          className="post-content mt-6 px-4 text-sm leading-relaxed text-neutral-600"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}

      {/* 첨부파일 이미지 */}
      {allImages.length > 0 && (
        <div className="mt-6">
          <GalleryImageList
            images={allImages}
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

    </div>
    </div>
    </>
  );
}
