"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

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

function getHqThumbnail(url: string | null): string | null {
  if (!url || url === ".") return null;
  const ytEmbed = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (ytEmbed) return `https://img.youtube.com/vi/${ytEmbed[1]}/hqdefault.jpg`;
  const ytWatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (ytWatch) return `https://img.youtube.com/vi/${ytWatch[1]}/hqdefault.jpg`;
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) return `https://img.youtube.com/vi/${ytShort[1]}/hqdefault.jpg`;
  return null;
}

function getYouTubeId(url: string | null): string | null {
  if (!url || url === ".") return null;
  const ytEmbed = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (ytEmbed) return ytEmbed[1];
  const ytWatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (ytWatch) return ytWatch[1];
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) return ytShort[1];
  return null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SermonContent({
  featured,
  sermons,
  isAdmin,
  adminSlot,
}: {
  featured: Sermon | null;
  sermons: Sermon[];
  isAdmin: boolean;
  adminSlot?: React.ReactNode;
}) {
  const [current, setCurrent] = useState<Sermon | null>(featured);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const playVideo = useCallback(
    (sermon: Sermon) => {
      setCurrent(sermon);
      setPlaying(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );

  const handleHeroPlay = useCallback(() => {
    setPlaying(true);
  }, []);

  return (
    <>
      {/* 히어로 플레이어 */}
      {current && (
        <div ref={playerRef} className="scroll-mt-16 flex flex-col overflow-hidden bg-neutral-800 md:flex-row">
          <div className="relative w-full shrink-0 overflow-hidden md:w-[420px]">
            {(() => {
              const videoId = getYouTubeId(current.youtube_url);
              if (playing && videoId) {
                return (
                  <div className="relative w-full overflow-hidden pt-[56.25%]">
                    <iframe
                      key={current.id}
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                      title={current.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }
              const thumb = getHqThumbnail(current.youtube_url);
              if (thumb) {
                return (
                  <button onClick={handleHeroPlay} className="relative block w-full overflow-hidden pt-[56.25%]">
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg">
                        <svg viewBox="0 0 24 24" fill="white" className="ml-1 h-7 w-7">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              }
              return (
                <div className="relative w-full overflow-hidden pt-[56.25%]">
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-700 text-4xl text-neutral-500">
                    🎙️
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="flex flex-1 flex-col justify-center px-6 py-5 md:px-10 md:py-8">
            <p className="text-sm text-neutral-400">
              [{formatDate(current.sermon_date)}] {current.category}
            </p>
            <div className="mt-2 h-px bg-neutral-600" />
            <h2 className="mt-4 text-xl font-bold text-white md:text-2xl">
              {current.title}
            </h2>
            <p className="mt-2 text-base text-neutral-300">
              {current.scripture && `${current.scripture} / `}
              {current.preacher}
            </p>
          </div>
        </div>
      )}

      {/* 관리자 슬롯 */}
      {adminSlot}

      {/* 설교 그리드 */}
      <div className="mt-6">
        {sermons.length === 0 ? (
          <p className="mt-12 text-center text-base text-neutral-400">
            등록된 설교가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-10">
            {sermons.map((sermon) => {
              const thumbnail = getThumbnail(sermon.youtube_url);
              return (
                <button
                  key={sermon.id}
                  onClick={() => playVideo(sermon)}
                  className="group relative text-left"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
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
                    {/* 재생 아이콘 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="line-clamp-2 min-h-[3rem] text-base font-semibold text-neutral-800 group-hover:text-navy">
                      {sermon.title}
                    </p>
                    {sermon.scripture && (
                      <p className="mt-1 text-sm text-neutral-500">{sermon.scripture}</p>
                    )}
                    <p className="mt-0.5 text-sm text-neutral-500">{sermon.preacher}</p>
                    <p className="mt-0.5 text-sm text-neutral-400">
                      {formatDate(sermon.sermon_date)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
