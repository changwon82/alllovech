import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";

function getEmbedUrl(url: string | null): string | null {
  if (!url || url === ".") return null;
  if (url.includes("youtube.com/embed/")) return url;
  const ytMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;
  if (url.includes("player.vimeo.com")) return url;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function getYoutubeUrl(url: string | null): string | null {
  if (!url || url === ".") return null;
  const ytEmbed = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (ytEmbed) return `https://www.youtube.com/watch?v=${ytEmbed[1]}`;
  const ytWatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (ytWatch) return `https://www.youtube.com/watch?v=${ytWatch[1]}`;
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) return `https://www.youtube.com/watch?v=${ytShort[1]}`;
  return url;
}

function getThumbnail(url: string | null): string | null {
  if (!url || url === ".") return null;
  const ytEmbed = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (ytEmbed) return `https://img.youtube.com/vi/${ytEmbed[1]}/mqdefault.jpg`;
  const ytWatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (ytWatch) return `https://img.youtube.com/vi/${ytWatch[1]}/mqdefault.jpg`;
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) return `https://img.youtube.com/vi/${ytShort[1]}/mqdefault.jpg`;
  return null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function SermonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getSessionUser();

  const { data: sermon } = await supabase
    .from("sermons")
    .select("*")
    .eq("id", parseInt(id, 10))
    .single();

  if (!sermon) notFound();

  const embedUrl = getEmbedUrl(sermon.youtube_url);
  const youtubeUrl = getYoutubeUrl(sermon.youtube_url);

  // 같은 카테고리 관련 영상 6개
  const { data: related } = await supabase
    .from("sermons")
    .select("id, title, preacher, sermon_date, scripture, youtube_url")
    .eq("category", sermon.category)
    .neq("id", sermon.id)
    .order("sermon_date", { ascending: false })
    .limit(6);

  return (
    <>
      {/* 메인 영역: 영상 + 정보 */}
      <div className="overflow-hidden bg-neutral-800 md:flex">
        {/* 영상 */}
        <div className="relative aspect-video w-full shrink-0 md:w-[55%]">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={sermon.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-700 text-4xl text-neutral-500">
              🎙️
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex flex-1 flex-col justify-between px-6 py-5 md:px-8 md:py-6">
          <div>
            <p className="text-sm text-neutral-400">
              [{formatDate(sermon.sermon_date)}] {sermon.category}
            </p>
            <div className="mt-3 h-px bg-neutral-600" />
            <h1 className="mt-4 text-xl font-bold text-white md:text-2xl">
              {sermon.title}
            </h1>
            <p className="mt-2 text-base text-neutral-300">
              {sermon.preacher}
            </p>
            {sermon.scripture && (
              <div className="mt-4">
                <p className="text-sm font-medium text-accent">
                  본문말씀 : {sermon.scripture}
                </p>
              </div>
            )}
          </div>

          {/* 유튜브 링크 */}
          {youtubeUrl && (
            <div className="mt-6 flex items-center gap-3">
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                유튜브에서 보기
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 관련영상 */}
      {related && related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-neutral-800">관련영상</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {related.map((r) => {
              const thumb = getThumbnail(r.youtube_url);
              return (
                <Link key={r.id} href={`/sermon/${r.id}`} className="group">
                  <div className="aspect-video overflow-hidden rounded-lg bg-neutral-100">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-300">
                        🎙️
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs font-medium text-neutral-700 group-hover:text-navy md:text-sm">
                    {r.title}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {r.scripture && `${r.scripture}`}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {formatDate(r.sermon_date)}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
