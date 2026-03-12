import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
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
  const { supabase } = await getSessionUser();

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

  // 첨부파일 중 이미지가 아닌 파일만 (다운로드용)
  const attachOtherFiles = (files || []).filter((f) => !isImageFile(f.file_name));

  return (
    <div className="mx-auto max-w-2xl pb-10">
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

      {/* 본문 — 원본 HTML 렌더링 (구 사이트 HTTP 이미지를 프록시 경로로 치환) */}
      {post.content && (
        <div
          className="post-content mt-4 px-4 text-sm leading-relaxed text-neutral-600"
          dangerouslySetInnerHTML={{
            __html: post.content.replaceAll(
              "http://alllovechurch.org/",
              "/proxy/old-site/"
            ),
          }}
        />
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

    </div>
  );
}
