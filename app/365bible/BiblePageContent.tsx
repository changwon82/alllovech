"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import YouTubePlayer from "./YouTubePlayer";
import TextSizeControl from "./TextSizeControl";
import { BOOK_FULL_TO_CODE } from "./plan";

// 한글 책코드 → 대한성서공회 book 파라미터
const BSK_BOOK_CODE: Record<string, string> = {
  창: "gen", 출: "ex",  레: "lev", 민: "num", 신: "deu",
  수: "jos", 삿: "jdg", 룻: "rut", 삼상: "1sa", 삼하: "2sa",
  왕상: "1ki", 왕하: "2ki", 대상: "1ch", 대하: "2ch",
  라: "ezr", 느: "neh", 더: "est", 욥: "job", 시: "psa",
  잠: "pro", 전: "ecc", 아: "sol", 사: "isa", 렘: "jer",
  애: "lam", 겔: "eze", 단: "dan", 호: "hos", 욜: "joe",
  암: "amo", 옵: "oba", 욘: "jon", 미: "mic", 나: "nah",
  합: "hab", 습: "zep", 학: "hag", 슥: "zec", 말: "mal",
  마: "mat", 막: "mar", 눅: "luk", 요: "joh", 행: "act",
  롬: "rom", 고전: "1co", 고후: "2co", 갈: "gal", 엡: "eph",
  빌: "phi", 골: "col", 살전: "1th", 살후: "2th",
  딤전: "1ti", 딤후: "2ti", 딛: "tit", 몬: "phm",
  히: "heb", 약: "jam", 벧전: "1pe", 벧후: "2pe",
  요일: "1jo", 요이: "2jo", 요삼: "3jo", 유: "jud", 계: "rev",
};


function getBSKUrl(bookCode: string, chapter: number): string {
  const bsk = BSK_BOOK_CODE[bookCode];
  if (!bsk) return "";
  return `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=${bsk}&chap=${chapter}&sec=1&cVersion=&fontSize=15px&fontWeight=normal`;
}

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
  compareContent?: string | null;
};
type DisplaySection = {
  book: string; chapter: number;
  startVerse?: number; endVerse?: number;
  showFullChapter: boolean;
  verses: DisplayVerse[];
};
type Reading = { day: number; title: string | null; youtube_id: string | null };
type BibleVersion = { id: number; code: string; name: string };

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
  versions,
  versionCode,
  compareMode,
  compareVersionName,
}: {
  day: number;
  dayDateIso: string;
  reading: Reading | null;
  displayTitle: string;
  sections: DisplaySection[];
  serverToday: number;
  versions: BibleVersion[];
  versionCode: string;
  compareMode: boolean;
  compareVersionName?: string;
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
  const sectionRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const idx = Number(el.dataset.sectionIdx);
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
          const idx = Number((entry.target as HTMLElement).dataset.sectionIdx);
          if (isNaN(idx)) continue;
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
            href={`/365bible?day=${day - 1}&version=${versionCode}${compareMode ? "&compare=true" : ""}`}
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
              href={`/365bible?day=${localToday}&version=${versionCode}${compareMode ? "&compare=true" : ""}`}
              className="shrink-0 rounded bg-navy px-2 py-1 text-xs font-medium text-white hover:bg-navy/90"
            >
              오늘로
            </Link>
          )}
        </div>

        {day < 365 ? (
          <Link
            href={`/365bible?day=${day + 1}&version=${versionCode}${compareMode ? "&compare=true" : ""}`}
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

      {/* 대한성서공회 개역개정 링크 */}
      {sections.length > 0 && (() => {
        const seen = new Set<string>();
        const links = sections.flatMap((sec) => {
          const key = `${sec.book}:${sec.chapter}`;
          if (seen.has(key)) return [];
          seen.add(key);
          const bookCode = BOOK_FULL_TO_CODE[sec.book.normalize("NFC")] ?? sec.book;
          const url = getBSKUrl(bookCode, sec.chapter);
          if (!url) return [];
          return [{ key, label: `${sec.book.normalize("NFC")} ${sec.chapter}장`, url }];
        });
        if (links.length === 0) return null;
        return (
          <section className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <div className="mb-1.5 text-xs font-semibold text-neutral-500">개역개정 (대한성서공회)</div>
            <div className="flex flex-wrap gap-x-1 gap-y-1">
              {links.map((l, i) => (
                <span key={l.key} className="flex items-center">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                  >
                    {l.label} ↗
                  </a>
                  {i < links.length - 1 && <span className="text-neutral-300">·</span>}
                </span>
              ))}
            </div>
          </section>
        );
      })()}

      {/* 성경 본문 */}
      {sections.length > 0 && (
        <section className="mt-8">
          <TextSizeControl
            headerLeft={
              versions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {versions.map((v) => (
                    <Link
                      key={v.code}
                      href={`/365bible?day=${day}&version=${v.code}${compareMode ? "&compare=true" : ""}`}
                      scroll={false}
                      className={
                        v.code === versionCode
                          ? "rounded-full bg-navy px-3 py-1 text-xs font-medium text-white"
                          : "rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
                      }
                    >
                      {v.name}
                    </Link>
                  ))}
                  {versions.length > 1 && (
                    <Link
                      href={`/365bible?day=${day}&version=${versionCode}${compareMode ? "" : "&compare=true"}`}
                      scroll={false}
                      className={
                        compareMode
                          ? "rounded-full bg-blue px-3 py-1 text-xs font-medium text-white"
                          : "rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
                      }
                    >
                      병행보기
                    </Link>
                  )}
                </div>
              ) : null
            }
          >
            {sections.map((sec, si) => (
                <div key={`${sec.book}-${sec.chapter}-${si}`} data-section-idx={si} ref={sectionRef}>
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
                        <span className="flex-1">
                          <span className="block font-bold" style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}>
                            {v.content}
                          </span>
                          {compareMode && v.compareContent && (
                            <span className="mt-1 block text-[0.88em] text-neutral-400">
                              {v.compareContent}
                            </span>
                          )}
                        </span>
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
            href={`/365bible?day=${day - 1}&version=${versionCode}${compareMode ? "&compare=true" : ""}`}
            className="text-sm text-neutral-500 hover:text-navy"
          >
            ← 이전
          </Link>
        ) : (
          <div />
        )}
        {day < 365 ? (
          <Link
            href={`/365bible?day=${day + 1}&version=${versionCode}${compareMode ? "&compare=true" : ""}`}
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
