"use client";

import { useRef, useCallback } from "react";

interface HeroPlayerProps {
  title: string;
  category: string;
  sermon_date: string;
  scripture: string | null;
  preacher: string;
  thumbnail: string | null;
  embedUrl: string | null;
}

export default function HeroPlayer({
  title,
  category,
  sermon_date,
  scripture,
  preacher,
  thumbnail,
  embedUrl,
}: HeroPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePlay = useCallback(() => {
    if (!containerRef.current || !embedUrl) return;
    const el = containerRef.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    el.innerHTML = `<iframe src="${embedUrl}?autoplay=1&mute=1" width="${w}" height="${h}" style="display:block" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>`;
  }, [embedUrl]);

  return (
    <div className="flex flex-col overflow-hidden bg-neutral-800 md:flex-row">
      <div
        ref={containerRef}
        className="relative aspect-video w-full shrink-0 overflow-hidden md:w-[420px]"
      >
        {thumbnail ? (
          <button
            onClick={handlePlay}
            className="relative h-full w-full cursor-pointer"
          >
            <img
              src={thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white transition-transform hover:scale-110">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-1 h-7 w-7"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-700 text-4xl text-neutral-500">
            🎙️
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center px-6 py-5 md:px-10 md:py-8">
        <p className="text-sm text-neutral-400">
          [{sermon_date}] {category}
        </p>
        <div className="mt-2 h-px bg-neutral-600" />
        <h2 className="mt-4 text-xl font-bold text-white md:text-2xl">
          {title}
        </h2>
        <p className="mt-2 text-base text-neutral-300">
          {scripture && `${scripture} / `}
          {preacher}
        </p>
      </div>
    </div>
  );
}
