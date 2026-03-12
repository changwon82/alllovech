import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import GalleryImageList from "./GalleryImageList";

const R2_BASE = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/gallery";

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getSessionUser();

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
  const contentImages: string[] = [];
  if (post.content) {
    // src="...", src='...', src=''...'' 등 다양한 형태 처리
    const regex = /src=["']+([^"']+)["']+/g;
    let match;
    while ((match = regex.exec(post.content)) !== null) {
      const url = match[1];
      // 이미지 확장자만 필터
      if (!/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url)) continue;
      const fileName = url.split("/").pop();
      if (fileName) contentImages.push(fileName);
    }
  }

  // 첨부파일 이미지
  const attachImages = (images || []).map((img) => img.file_name);

  // 합치기 (첨부파일 우선, 중복 제거)
  const allImages = [...new Set([...attachImages, ...contentImages])];

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
      <div className="px-4 pt-4">
        <Link
          href="/gallery"
          className="mb-3 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
        >
          ← 목록으로
        </Link>

        <h1 className="text-xl font-bold text-neutral-800">{post.title}</h1>

        <div className="mt-2 flex items-center gap-3 text-sm text-neutral-500">
          <span>{new Date(post.post_date).toLocaleDateString("ko-KR")}</span>
          <span>·</span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs">
            {post.category}
          </span>
          <span>·</span>
          <span className="text-xs text-neutral-400">조회 {post.hit_count}</span>
        </div>
      </div>

      {/* 본문 — 원본 HTML 그대로 렌더링 */}
      {post.content && (
        <div
          className="post-content mt-4 px-4 text-sm leading-relaxed text-neutral-600"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}

      {/* 첨부파일 이미지 (본문에 없는 것) */}
      {allImages.length > 0 && (
        <div className="mt-4 px-4">
          <GalleryImageList
            images={allImages.map((name) => `${R2_BASE}/${name}`)}
            title={post.title}
          />
        </div>
      )}

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
