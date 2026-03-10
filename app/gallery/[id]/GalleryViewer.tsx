"use client";

import { useState } from "react";

export default function GalleryViewer({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-neutral-100">
        <span className="text-4xl text-neutral-300">📷</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={images[current]}
        alt=""
        className="w-full bg-neutral-100 object-contain"
        style={{ maxHeight: "70vh" }}
      />

      {images.length > 1 && (
        <>
          {/* 좌우 버튼 */}
          {current > 0 && (
            <button
              onClick={() => setCurrent(current - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2.5 py-1.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              ‹
            </button>
          )}
          {current < images.length - 1 && (
            <button
              onClick={() => setCurrent(current + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2.5 py-1.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              ›
            </button>
          )}

          {/* 인디케이터 */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
