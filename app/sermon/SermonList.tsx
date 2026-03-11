import Link from "next/link";

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
  // YouTube: embed/ID, ?v=ID, youtu.be/ID
  const ytEmbed = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (ytEmbed) return `https://img.youtube.com/vi/${ytEmbed[1]}/mqdefault.jpg`;
  const ytWatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (ytWatch) return `https://img.youtube.com/vi/${ytWatch[1]}/mqdefault.jpg`;
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) return `https://img.youtube.com/vi/${ytShort[1]}/mqdefault.jpg`;
  // Vimeo: player.vimeo.com/video/ID, vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
  return null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function SermonList({ sermons }: { sermons: Sermon[] }) {
  if (sermons.length === 0) {
    return (
      <p className="mt-12 text-center text-sm text-neutral-400">
        등록된 설교가 없습니다.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {sermons.map((sermon) => {
        const thumbnail = getThumbnail(sermon.youtube_url);

        return (
          <Link
            key={sermon.id}
            href={`/sermon/${sermon.id}`}
            className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* 썸네일 */}
            {thumbnail ? (
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <img
                  src={thumbnail}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                <span className="text-2xl text-neutral-300">🎙️</span>
              </div>
            )}

            {/* 정보 */}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p className="truncate text-sm font-semibold text-neutral-800">
                {sermon.title}
              </p>
              {sermon.scripture && (
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {sermon.scripture}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-400">
                <span>{sermon.preacher}</span>
                <span>·</span>
                <span>{formatDate(sermon.sermon_date)}</span>
                <span>·</span>
                <span className="text-accent">{sermon.category}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
