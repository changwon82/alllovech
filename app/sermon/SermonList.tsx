import Link from "next/link";
import { SermonCardAdmin } from "./SermonAdmin";

type Sermon = {
  id: number;
  title: string;
  preacher: string;
  sermon_date: string;
  scripture: string | null;
  category: string;
  youtube_url: string | null;
};

function getThumbnail(url: string | null): string | null {
  if (!url || url === ".") return null;
  const ytEmbed = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (ytEmbed) return `https://img.youtube.com/vi/${ytEmbed[1]}/mqdefault.jpg`;
  const ytWatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (ytWatch) return `https://img.youtube.com/vi/${ytWatch[1]}/mqdefault.jpg`;
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) return `https://img.youtube.com/vi/${ytShort[1]}/mqdefault.jpg`;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
  return null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SermonList({
  sermons,
  isAdmin,
  categories,
}: {
  sermons: Sermon[];
  isAdmin?: boolean;
  categories?: string[];
}) {
  if (sermons.length === 0) {
    return (
      <p className="mt-12 text-center text-base text-neutral-400">
        등록된 설교가 없습니다.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
      {sermons.map((sermon) => {
        const thumbnail = getThumbnail(sermon.youtube_url);

        return (
          <Link
            key={sermon.id}
            href={`/sermon/${sermon.id}`}
            className="group relative"
          >
            {/* 관리자 수정/삭제 */}
            {isAdmin && categories && (
              <SermonCardAdmin sermon={sermon} categories={categories} />
            )}

            {/* 썸네일 */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-100">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-neutral-300">
                  🎙️
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="mt-2.5">
              <p className="line-clamp-2 text-sm font-semibold text-neutral-800 group-hover:text-navy md:text-base">
                {sermon.title}
              </p>
              {sermon.scripture && (
                <p className="mt-1 text-xs text-neutral-500 md:text-sm">
                  {sermon.scripture} | {sermon.preacher}
                </p>
              )}
              <p className="mt-1 text-xs text-neutral-400">
                {formatDate(sermon.sermon_date)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
