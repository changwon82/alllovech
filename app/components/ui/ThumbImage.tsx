"use client";

import { useState } from "react";

/** 썸네일 → 원본 fallback 이미지 */
export default function ThumbImage({
  src,
  thumbSrc,
  alt = "",
  className = "",
}: {
  src: string;
  thumbSrc: string;
  alt?: string;
  className?: string;
}) {
  const [imgSrc, setImgSrc] = useState(thumbSrc);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (imgSrc !== src) setImgSrc(src);
      }}
    />
  );
}
