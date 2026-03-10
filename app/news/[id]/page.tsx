import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";
import NewsImageList from "./NewsImageList";

const R2_NEWS = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/news";

// 이미지 확장자 판별
function isImageFile(fileName: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getSessionUser();

  const [{ data: post }, { data: files }] = await Promise.all([
    supabase
      .from("news_posts")
      .select("*")
      .eq("id", parseInt(id, 10))
      .single(),
    supabase
      .from("news_files")
      .select("file_name, original_name, sort_order")
      .eq("post_id", parseInt(id, 10))
      .order("sort_order"),
  ]);

  if (!post) notFound();

  // content에서 이미지 파일명 추출
  const contentImages: string[] = [];
  if (post.content) {
    const regex = /src=["']?([^"'\s>]+)["'\s>]/g;
    let match;
    while ((match = regex.exec(post.content)) !== null) {
      const url = match[1];
      if (!isImageFile(url)) continue;
      const fileName = url.split("/").pop();
      if (fileName) contentImages.push(fileName);
    }
  }

  // 첨부파일 중 이미지만 분리
  const attachImageFiles = (files || []).filter((f) => isImageFile(f.file_name));
  const attachOtherFiles = (files || []).filter((f) => !isImageFile(f.file_name));

  // 이미지 URL 합치기 (첨부파일 우선, 중복 제거)
  const attachImageUrls = attachImageFiles.map((img) => `${R2_NEWS}/${img.file_name}`);
  const contentImageUrls = contentImages.map((name) => `${R2_NEWS}/${name}`);
  const allImageUrls = [...new Set([...attachImageUrls, ...contentImageUrls])];

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
      <div className="px-4 pt-4">
        <Link
          href="/news"
          className="mb-3 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
        >
          ← 목록으로
        </Link>

        <h1 className="text-xl font-bold text-neutral-800">{post.title}</h1>

        <div className="mt-2 flex items-center gap-3 text-sm text-neutral-500">
          <span>{new Date(post.post_date).toLocaleDateString("ko-KR")}</span>
          <span>·</span>
          <span className="text-xs text-neutral-400">조회 {post.hit_count}</span>
        </div>
      </div>

      {/* 이미지 목록 */}
      {allImageUrls.length > 0 && (
        <div className="mt-4 px-4">
          <NewsImageList images={allImageUrls} title={post.title} />
        </div>
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
          <div className="mt-6 space-y-3 px-4">
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
          <div className="mt-6 whitespace-pre-line px-4 text-sm leading-relaxed text-neutral-600">
            {text}
          </div>
        );
      })()}

      {/* 첨부파일 다운로드 (이미지가 아닌 파일) */}
      {attachOtherFiles.length > 0 && (
        <div className="mt-8 px-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-600">첨부파일</h3>
          <div className="space-y-2">
            {attachOtherFiles.map((file, i) => (
              <a
                key={i}
                href={`${R2_NEWS}/${file.file_name}`}
                download={file.original_name || file.file_name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                <span className="shrink-0 text-base">
                  {/\.pdf$/i.test(file.file_name) ? "📄" :
                   /\.hwp$/i.test(file.file_name) ? "📝" :
                   /\.(zip|rar|7z)$/i.test(file.file_name) ? "📦" :
                   "📎"}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {file.original_name || file.file_name}
                </span>
                <span className="shrink-0 text-xs text-neutral-400">다운로드</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user?.id} />
    </div>
  );
}
