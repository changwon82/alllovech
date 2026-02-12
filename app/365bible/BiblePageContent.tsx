"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import YouTubePlayer from "./YouTubePlayer";
import TextSizeControl from "./TextSizeControl";

function getLocalDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

type DisplayVerse = {
  book: string; chapter: number; verse: number;
  heading: string | null; content: string;
  highlighted: boolean;
};
type DisplaySection = {
  book: string; chapter: number;
  startVerse?: number; endVerse?: number;
  showFullChapter: boolean;
  verses: DisplayVerse[];
};
type Reading = { day: number; title: string | null; youtube_id: string | null };

const BIBLE_VERSION = "개역개정";

function getSectionHeader(sec: DisplaySection): string {
  let header = `${sec.book.normalize("NFC")} ${sec.chapter}장`;
  if (sec.startVerse != null && sec.endVerse != null) {
    header += ` ${sec.startVerse}-${sec.endVerse}절`;
  } else if (sec.startVerse != null) {
    header += ` ${sec.startVerse}절~`;
  } else if (sec.endVerse != null) {
    header += ` ~${sec.endVerse}절`;
  }
  return header;
}

export default function BiblePageContent({
  day,
  dayDateIso,
  reading,
  displayTitle,
  sections,
  serverToday,
}: {
  day: number;
  dayDateIso: string;
  reading: Reading | null;
  displayTitle: string;
  sections: DisplaySection[];
  serverToday: number;
}) {
  const [localToday, setLocalToday] = useState(serverToday);
  useEffect(() => {
    setLocalToday(getLocalDayOfYear());
  }, []);
  const isToday = day === localToday;

  const infoRef = useRef<HTMLElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = infoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 현재 보이는 섹션 추적
  const sectionEls = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const sectionRef = useCallback((idx: number) => (el: HTMLDivElement | null) => {
    sectionEls.current[idx] = el;
  }, []);

  // day 전환 시 activeIdx 초기화 + stale ref 정리
  useEffect(() => {
    setActiveIdx(0);
    sectionEls.current.length = sections.length;
  }, [day, sections.length]);

  useEffect(() => {
    const els = sectionEls.current;
    if (els.length === 0) return;
    const visible = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = els.indexOf(entry.target as HTMLDivElement);
          if (idx === -1) continue;
          if (entry.isIntersecting) visible.add(idx);
          else visible.delete(idx);
        }
        if (visible.size > 0) setActiveIdx(Math.min(...visible));
      },
      { rootMargin: "0px 0px -70% 0px" }
    );
    for (const el of els) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [day, sections.length]);

  const dayDate = new Date(dayDateIso);
  const dateStr = dayDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekdayStr = dayDate.toLocaleDateString("ko-KR", { weekday: "short" });

  return (
    <>
      {/* 스크롤 시 고정 헤더 */}
      <div
        className={`fixed top-0 right-0 left-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm transition-transform duration-200 ${
          showSticky ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
          <span className={`shrink-0 text-sm font-bold ${isToday ? "text-blue" : "text-neutral-800"}`}>
            Day {day}
          </span>
          <div className="flex min-w-0 flex-wrap gap-x-1.5 gap-y-0.5">
            {sections.map((sec, i) => (
              <span
                key={i}
                className={`text-xs whitespace-nowrap transition-colors duration-150 ${
                  i === activeIdx
                    ? "font-bold text-navy"
                    : "text-neutral-300"
                }`}
              >
                {getSectionHeader(sec)}{i < sections.length - 1 && <span className="text-neutral-200"> · </span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Day 번호 (상자 위) */}
      <p
        className={`mt-0.5 text-center text-[2.5rem] font-bold leading-tight tracking-tight ${
          isToday ? "text-blue" : "text-neutral-800"
        }`}
      >
        Day {day}
      </p>

      {/* 날짜 네비게이션 - 이전/날짜/다음 수직 정렬 동일 */}
      <div className="mt-2 flex items-stretch justify-between gap-2">
        {day > 1 ? (
          <Link
            href={`/365bible?day=${day - 1}`}
            className="flex shrink-0 items-center rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            ← Day {day - 1}
          </Link>
        ) : (
          <div className="w-20 shrink-0" />
        )}

        <div
          className={`flex min-w-0 flex-1 flex-nowrap items-center justify-center gap-2 rounded-lg border px-2 py-2 sm:px-3 ${
            isToday ? "border-blue/20 bg-blue/5 font-medium text-blue" : "border-neutral-200 bg-neutral-50 text-neutral-700"
          }`}
        >
          <span className="min-w-0 shrink truncate text-xs whitespace-nowrap sm:text-sm">
            {dateStr} ({weekdayStr})
          </span>
          {!isToday && (
            <Link
              href="/365bible"
              className="shrink-0 rounded bg-navy px-2 py-1 text-xs font-medium text-white hover:bg-navy/90"
            >
              오늘로
            </Link>
          )}
        </div>

        {day < 365 ? (
          <Link
            href={`/365bible?day=${day + 1}`}
            className="flex shrink-0 items-center rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Day {day + 1} →
          </Link>
        ) : (
          <div className="w-20 shrink-0" />
        )}
      </div>

      {/* 읽기 정보 */}
      {reading ? (
        <section
          ref={infoRef}
          className={`mt-4 rounded-2xl border p-5 md:p-6 ${
            isToday ? "border-blue/20 bg-blue/5" : "border-neutral-200 bg-neutral-50"
          }`}
        >
          <p className="text-xl font-bold text-neutral-800">{displayTitle}</p>
        </section>
      ) : (
        <section ref={infoRef} className="mt-4 rounded-2xl border border-neutral-200 p-6 text-center text-neutral-500">
          읽기표를 불러올 수 없습니다
        </section>
      )}

      {/* 유튜브 영상 */}
      {reading?.youtube_id && (
        <section className="mt-6">
          <YouTubePlayer key={reading.youtube_id} videoId={reading.youtube_id} />
        </section>
      )}

      {/* 성경 본문 */}
      {sections.length > 0 && (
        <section className="mt-8">
          <TextSizeControl version={BIBLE_VERSION}>
            {sections.map((sec, si) => (
                <div key={`${sec.book}-${sec.chapter}-${si}`} ref={sectionRef(si)}>
                  <h2
                    className={`${si === 0 ? "mt-0" : "mt-10"} mb-4 border-b border-neutral-200 pb-2 text-lg font-bold text-navy`}
                  >
                    {getSectionHeader(sec)}
                  </h2>
                  {sec.verses.map((v) => (
                    <div key={`${v.book}-${v.chapter}-${v.verse}`}>
                      {v.heading && (
                        <p className={`mt-5 mb-2 font-bold ${v.highlighted ? "text-blue" : "text-blue/30"}`}>
                          {v.heading}
                        </p>
                      )}
                      <p className={`mt-3 flex ${v.highlighted ? "text-neutral-700" : "text-neutral-300"}`}>
                        <span className={`mr-1.5 mt-[0.3em] min-w-[1.5em] shrink-0 text-right text-[0.75em] font-medium ${v.highlighted ? "text-neutral-400" : "text-neutral-200"}`}>
                          {v.verse}
                        </span>
                        <span>{v.content}</span>
                      </p>
                    </div>
                  ))}
                </div>
            ))}
          </TextSizeControl>
        </section>
      )}

      {/* 하단 네비게이션 */}
      <div className="mt-12 flex items-center justify-between border-t border-neutral-200 pt-6 pb-8">
        {day > 1 ? (
          <Link
            href={`/365bible?day=${day - 1}`}
            className="text-sm text-neutral-500 hover:text-navy"
          >
            ← 이전
          </Link>
        ) : (
          <div />
        )}
        {day < 365 ? (
          <Link
            href={`/365bible?day=${day + 1}`}
            className="text-sm text-neutral-500 hover:text-navy"
          >
            다음 →
          </Link>
        ) : (
          <div />
        )}
      </div>
      {/* 마지막 섹션이 짧아도 스크롤로 상단 감지 영역까지 올릴 수 있도록 여백 */}
      {sections.length > 0 && <div className="h-[60vh]" />}
    </>
  );
}
