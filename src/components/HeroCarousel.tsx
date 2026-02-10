"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const FALLBACK_SLIDES = [
  { image_url: "/images/home/main_visual01.jpg", title: "나를 따르라", subtitle: "Follow Me! Deny yourself and take up the cross (Mt 16:24)\n자기를 부인하고, 자기 십자가를 지고 (마 16:24)" },
  { image_url: "/images/home/main_visual02.jpg", title: "나를 따르라", subtitle: "Follow Me! Deny yourself and take up the cross (Mt 16:24)\n자기를 부인하고, 자기 십자가를 지고 (마 16:24)" },
];

export interface HeroSlide {
  image_url: string;
  title: string;
  subtitle: string | null;
}

interface HeroCarouselProps {
  /** DB에서 가져온 히어로 슬라이드. 없거나 비면 fallback 이미지 사용 */
  slides?: HeroSlide[] | null;
}

export default function HeroCarousel({ slides: propSlides }: HeroCarouselProps) {
  const slides = (propSlides && propSlides.length > 0) ? propSlides : FALLBACK_SLIDES;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const current = slides[index];
  const subtitleLines = current?.subtitle?.split("\n").filter(Boolean) ?? [];

  return (
    <section className="relative h-[280px] w-full overflow-hidden sm:h-[340px] md:h-[400px]">
      {slides.map((slide, i) => (
        <div
          key={slide.image_url + i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "z-0 opacity-100" : "z-0 opacity-0"
          }`}
        >
          <Image
            src={slide.image_url}
            alt={slide.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority={i === 0}
            unoptimized={slide.image_url.startsWith("http")}
          />
        </div>
      ))}
      <div className="absolute inset-0 z-10 bg-black/40" />
      <div className="absolute inset-0 z-20 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl md:text-5xl">
            {current?.title ?? "나를 따르라"}
          </h1>
          {subtitleLines.map((line, i) => (
            <p key={i} className={i === 0 ? "mt-2 text-sm text-white/90 sm:text-base" : "mt-1 text-sm font-medium text-white/95"}>
              {line}
            </p>
          ))}
          {subtitleLines.length === 0 && (
            <>
              <p className="mt-2 text-sm text-white/90 sm:text-base">
                Follow Me! Deny yourself and take up the cross (Mt 16:24)
              </p>
              <p className="mt-1 text-sm font-medium text-white/95">
                자기를 부인하고, 자기 십자가를 지고 (마 16:24)
              </p>
            </>
          )}
          <div className="mt-6 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === index ? "bg-white" : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`${i + 1}번째 이미지로 이동`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
