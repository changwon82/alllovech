import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";
import GalleryViewer from "./GalleryViewer";
import GalleryImageList from "./GalleryImageList";

const R2_BASE = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/gallery";

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getSessionUser();

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
    <div className="mx-auto min-h-screen max-w-2xl pb-20">
      {/* 이미지 뷰어 */}
      <GalleryViewer
        images={allImages.map((name) => `${R2_BASE}/${name}`)}
      />

      {/* 게시글 정보 */}
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

        {/* 이미지 목록 (전체) */}
        {allImages.length > 1 && (
          <GalleryImageList
            images={allImages.map((name) => `${R2_BASE}/${name}`)}
            title={post.title}
          />
        )}

        {/* 유튜브 영상 */}
        {post.content && (() => {
          const videos: string[] = [];
          const iframeRegex = /src=["']?(https?:\/\/(?:www\.)?youtube\.com\/embed\/[^"'\s]+)["'\s]/g;
          let m;
          while ((m = iframeRegex.exec(post.content)) !== null) {
            videos.push(m[1]);
          }
          if (videos.length === 0) return null;
          return (
            <div className="mt-6 space-y-3">
              {videos.map((url, i) => (
                <div key={i} className="aspect-video w-full overflow-hidden rounded-lg">
                  <iframe
                    src={url}
                    title={`영상 ${i + 1}`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
          );
        })()}

        {/* 텍스트 내용 */}
        {post.content && (() => {
          const text = post.content
            .replace(/<img[^>]*>/gi, "")
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .trim();
          if (!text) return null;
          return (
            <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
              {text}
            </div>
          );
        })()}
      </div>

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user?.id} />
    </div>
  );
}
