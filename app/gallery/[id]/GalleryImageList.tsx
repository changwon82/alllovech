"use client";

import { useState } from "react";
import ImageLightbox from "@/app/components/ui/ImageLightbox";

export default function GalleryImageList({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <>
      <div className="mt-6 space-y-2">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${title} ${i + 1}`}
            className="w-full cursor-pointer rounded-lg transition hover:opacity-90"
            loading="lazy"
            onClick={() => setLightboxSrc(src)}
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ))}
      </div>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}
