"use client";

import { useVideoPlayer } from "./VideoPlayerContext";

export default function StickyVideoPlayer() {
  const { video, stop, inlineVisible } = useVideoPlayer();

  // 인라인 플레이어가 보이는 중이면 전역 플레이어 숨김
  if (!video || inlineVisible) return null;

  return (
    <div className="sticky top-14 z-40 md:hidden">
      <div className="relative w-full bg-black">
        <div className="relative w-full pt-[56.25%]">
          <iframe
            key={video.id}
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&playsinline=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button
          onClick={stop}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
          aria-label="영상 닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
