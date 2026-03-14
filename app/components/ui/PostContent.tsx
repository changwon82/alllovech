"use client";

import { useState, useCallback, useMemo } from "react";
import ImageLightbox from "./ImageLightbox";

function highlightHtml(html: string, term: string): string {
  if (!term) return html;
  // HTML 태그와 텍스트를 분리하여 텍스트 부분만 하이라이트
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  return html.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, text) => {
    if (tag) return tag;
    return text.replace(re, '<mark class="bg-yellow-200 text-inherit rounded-sm px-0.5">$1</mark>');
  });
}

/**
 * HTML 본문을 렌더링하며, 이미지 클릭 시 라이트박스로 원본 보기
 */
export default function PostContent({
  html,
  className,
  highlight,
}: {
  html: string;
  className?: string;
  highlight?: string;
}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const rendered = useMemo(
    () => (highlight ? highlightHtml(html, highlight) : html),
    [html, highlight],
  );

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
        dangerouslySetInnerHTML={{ __html: rendered }}
        onClick={handleClick}
      />

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}
