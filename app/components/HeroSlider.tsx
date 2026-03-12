"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

export type HeroSlide = {
  type: "image" | "youtube";
  src?: string;
  videoId?: string;
  title: string;
  sub: string;
  duration: number;
  enabled?: boolean;
  objectPosition?: string;
};

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    type: "image",
    src: "http://alllovechurch.org/theme/daontheme_ver2_11/html/image/main_visual01.jpg",
    title: "하나님의 마음에 합한\n교회",
    sub: "내가 이새의 아들 다윗을 만나니\n내 마음에 합한 사람이라 내 뜻을 다 이루게 하리라(행13:22)",
    duration: 8000,
  },
  {
    type: "youtube",
    videoId: "u7khGTfCWcA",
    title: "다니엘과 에스더를 키우는\n교회",
    sub: "대를 이어가며 주님오실 때까지\n쓰임받는 교회가 되길 기도합니다",
    duration: 31000,
  },
  {
    type: "image",
    src: "http://alllovechurch.org/theme/daontheme_ver2_11/html/image/main_visual02.jpg",
    title: "한 사람의 성숙을 지향하는\n교회",
    sub: "다애교회는 교회성장이 아닌, 한 사람 한 사람이\n그리스도를 닮아 성숙(成熟)해지는 것을 지향합니다",
    duration: 8000,
  },
];

export default function HeroSlider({
  slides: slidesProp,
  children,
}: {
  slides?: HeroSlide[];
  children?: React.ReactNode;
}) {
  const allSlides = slidesProp && slidesProp.length > 0 ? slidesProp : DEFAULT_SLIDES;
  const slides = allSlides.filter((s) => s.enabled !== false);
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const timer = setTimeout(next, slides[current].duration);
    return () => clearTimeout(timer);
  }, [current, next, slides]);

  const slide = slides[current];

  return (
    <>
      {/* 배경 슬라이드 (absolute — 부모 section이 relative) */}
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {s.type === "image" ? (
            <Image
              src={s.src!}
              alt=""
              fill
              priority={i === 0}
              className="hero-slide-img object-cover"
              style={s.objectPosition ? { "--mobile-pos": s.objectPosition } as React.CSSProperties : undefined}
            />
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${s.videoId}?autoplay=${i === current ? 1 : 0}&mute=1&loop=1&playlist=${s.videoId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ border: 0, pointerEvents: "none", width: "max(100%, 177.78vh)", height: "max(100%, 56.25vw)" }}
              allow="autoplay; encrypted-media"
              tabIndex={-1}
            />
          )}
        </div>
      ))}

      {/* 콘텐츠 레이어 */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-5 md:flex-row md:items-end md:justify-between">
        {/* 좌측: 슬로건 */}
        <div key={current} className="mb-8 md:mb-16">
          <div className="animate-fade-in" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8), 0 0 80px rgba(0,0,0,0.5), 0 0 120px rgba(0,0,0,0.3)" }}>
            <h1 className="whitespace-pre-line text-[28px] font-bold leading-snug text-white md:text-[42px]">
              {slide.title}
            </h1>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-white/80 md:text-[24px] md:leading-relaxed">
              {slide.sub}
            </p>
          </div>
          {/* 인디케이터 */}
          <div className="mt-5 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-red-500" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        </div>

        {/* 우측: 서비스 아이콘 (서버 컴포넌트에서 전달) */}
        {children}
      </div>

      {/* 모바일에서만 objectPosition 적용 */}
      <style>{`
        @media (max-width: 767px) {
          .hero-slide-img {
            object-position: var(--mobile-pos, center center) !important;
          }
        }
      `}</style>
    </>
  );
}
