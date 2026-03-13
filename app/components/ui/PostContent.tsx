"use client";

import { useState, useCallback } from "react";
import ImageLightbox from "./ImageLightbox";

/**
 * HTML 본문을 렌더링하며, 이미지 클릭 시 라이트박스로 원본 보기
 */
export default function PostContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const src = (target as HTMLImageElement).src;
      if (src) setLightboxSrc(src);
    }
  }, []);

  return (
    <>
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleClick}
      />

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}
