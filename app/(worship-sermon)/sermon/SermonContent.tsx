"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useVideoPlayer } from "@/app/components/VideoPlayerContext";

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
  const m = url.match(/embed\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]v=([a-zA-Z0-9_-]+)/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`;
  const v = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (v) return `https://vumbnail.com/${v[1]}.jpg`;
  return null;
}

function getHqThumbnail(url: string | null): string | null {
  if (!url || url === ".") return null;
  const m = url.match(/embed\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]v=([a-zA-Z0-9_-]+)/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

function getYouTubeId(url: string | null): string | null {
  if (!url || url === ".") return null;
  const m = url.match(/embed\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]v=([a-zA-Z0-9_-]+)/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
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
  children,
}: {
  featured: Sermon | null;
  sermons: Sermon[];
  isAdmin: boolean;
  adminSlot?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [current, setCurrent] = useState<Sermon | null>(featured);
  const [playing, setPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { play: playGlobal, stop: stopGlobal, setInlineVisible } = useVideoPlayer();
  const listRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // 뷰포트 크기 감지 (iframe 중복 렌더링 방지)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // featured ID 변경 시 (네비게이션으로 재진입) → 초기 상태로 리셋
  // 페이지네이션은 featured ID가 동일하므로 트리거 안 됨
  const featuredId = featured?.id ?? null;
  useEffect(() => {
    setCurrent(featured);
    setPlaying(false);
    stopGlobal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredId, stopGlobal]);

  // 언마운트 시 (페이지 이동) → 영상 정지
  useEffect(() => {
    return () => stopGlobal();
  }, [stopGlobal]);

  // 페이지네이션으로 sermons 변경 시 → 목록 시작 위치로 스크롤
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (listRef.current && isMobile) {
      listRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [sermons, isMobile]);

  const startPlay = useCallback((sermon: Sermon) => {
    const vid = getYouTubeId(sermon.youtube_url);
    if (!vid) return;
    setCurrent(sermon);
    setPlaying(true);
    playGlobal({ id: sermon.id, title: sermon.title, videoId: vid });
    setInlineVisible(true);
  }, [playGlobal, setInlineVisible]);

  const selectVideo = useCallback((sermon: Sermon) => {
    setCurrent(sermon);
    setPlaying(false);
    stopGlobal();
    if (listRef.current && window.innerWidth < 768) {
      listRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [stopGlobal]);

  const handleHeroPlay = useCallback(() => {
    if (current) startPlay(current);
  }, [current, startPlay]);

  const videoId = current ? getYouTubeId(current.youtube_url) : null;
  const thumb = current ? getHqThumbnail(current.youtube_url) : null;

  /* ── 모바일 영상 + 정보 (함께 sticky) ── */
  const mobileHero = current && (
    <div className={`md:hidden ${playing ? "sticky top-14 z-20" : ""}`}>
      <div className="bg-black">
        {playing && videoId && isMobile ? (
          <div className="relative w-full pt-[56.25%]">
            <iframe
              key={current.id}
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`}
              title={current.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : thumb ? (
          <button onClick={handleHeroPlay} className="relative block w-full overflow-hidden pt-[56.25%]">
            <Image src={thumb} alt="" fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg">
                <svg viewBox="0 0 24 24" fill="white" className="ml-1 h-7 w-7"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
          </button>
        ) : (
          <div className="relative w-full pt-[56.25%]">
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-700 text-4xl text-neutral-500">🎙️</div>
          </div>
        )}
      </div>
      <div className="bg-neutral-800 px-6 py-5">
        <p className="text-sm text-neutral-400">[{formatDate(current.sermon_date)}] {current.category}</p>
        <div className="mt-2 h-px bg-neutral-600" />
        <h2 className="mt-4 text-xl font-bold text-white">{current.title}</h2>
        <p className="mt-2 text-base text-neutral-300">
          {current.scripture && `${current.scripture} / `}{current.preacher}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── 데스크톱 히어로 (sticky 불필요) ── */}
      {current && (
        <div className="hidden scroll-mt-16 overflow-hidden bg-neutral-800 md:flex md:flex-row">
          <div className="relative w-[420px] shrink-0 overflow-hidden">
            {playing && videoId && !isMobile ? (
              <div className="relative w-full overflow-hidden pt-[56.25%]">
                <iframe key={current.id} className="absolute inset-0 h-full w-full" src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} title={current.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : thumb ? (
              <button onClick={handleHeroPlay} className="relative block w-full overflow-hidden pt-[56.25%]">
                <Image src={thumb} alt="" fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg">
                    <svg viewBox="0 0 24 24" fill="white" className="ml-1 h-7 w-7"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </button>
            ) : (
              <div className="relative w-full overflow-hidden pt-[56.25%]">
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-700 text-4xl text-neutral-500">🎙️</div>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center px-10 py-8">
            <p className="text-sm text-neutral-400">[{formatDate(current.sermon_date)}] {current.category}</p>
            <div className="mt-2 h-px bg-neutral-600" />
            <h2 className="mt-4 text-2xl font-bold text-white">{current.title}</h2>
            <p className="mt-2 text-base text-neutral-300">
              {current.scripture && `${current.scripture} / `}{current.preacher}
            </p>
          </div>
        </div>
      )}

      {/*
        ── 모바일: sticky 부모 = 이 div 전체 ──
        sticky는 부모 안에서만 동작하므로, 영상 + 정보 + 관리자 + 리스트 + 페이지네이션을 모두 감쌈
      */}
      <div ref={listRef} className="scroll-mt-14 md:hidden">
        {mobileHero}

        {/* 관리자 슬롯 */}
        {adminSlot}

        {/* 설교 리스트 */}
        <div className="mt-6">
          {sermons.length === 0 ? (
            <p className="mt-12 text-center text-base text-neutral-400">등록된 설교가 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sermons.slice(0, 10).map((sermon) => {
                const thumbnail = getThumbnail(sermon.youtube_url);
                return (
                  <button key={sermon.id} onClick={() => selectVideo(sermon)} className="group flex items-start gap-3 text-left">
                    <div className="relative aspect-video w-[30%] shrink-0 overflow-hidden bg-neutral-100">
                      {thumbnail ? (
                        <img src={thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl text-neutral-300">🎙️</div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-3.5 w-3.5"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="line-clamp-1 text-[14px] font-semibold text-neutral-800 group-hover:text-navy">{sermon.title}</p>
                      {sermon.scripture && <p className="mt-0.5 text-[12px] text-neutral-500">{sermon.scripture}</p>}
                      <p className="mt-0.5 text-[12px] text-neutral-400">{sermon.preacher} · {formatDate(sermon.sermon_date)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 페이지네이션 + 검색 (children) */}
        {children}
      </div>

      {/* ── 데스크톱: 관리자 + 리스트 + children ── */}
      <div className="hidden md:block">
        {adminSlot}
        <div className="mt-6">
          {sermons.length === 0 ? (
            <p className="mt-12 text-center text-base text-neutral-400">등록된 설교가 없습니다.</p>
          ) : (
            <div className="md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-10">
              {sermons.map((sermon) => {
                const thumbnail = getThumbnail(sermon.youtube_url);
                return (
                  <button key={sermon.id} onClick={() => selectVideo(sermon)} className="group relative text-left">
                    <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
                      {thumbnail ? (
                        <img src={thumbnail} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl text-neutral-300">🎙️</div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="line-clamp-2 min-h-[2.4rem] text-[14px] font-semibold text-neutral-800 group-hover:text-navy">{sermon.title}</p>
                      {sermon.scripture && <p className="mt-1 text-sm text-neutral-500">{sermon.scripture}</p>}
                      <p className="mt-0.5 text-sm text-neutral-500">{sermon.preacher}</p>
                      <p className="mt-0.5 text-sm text-neutral-400">{formatDate(sermon.sermon_date)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {children}
      </div>
    </>
  );
}
