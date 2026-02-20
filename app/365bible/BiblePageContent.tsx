"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import YouTubePlayer from "./YouTubePlayer";
import TextSizeControl from "./TextSizeControl";
import { BOOK_FULL_TO_CODE } from "./plan";
import { saveReflection, deleteReflection, type Reflection } from "./actions";
import { createClient } from "@/lib/supabase/client";

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

type UserInfo = { id: string; name: string; status: string } | null;

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
  user,
  checkedDays: initialCheckedDays,
  year,
  existingReflection,
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
  user: UserInfo;
  checkedDays: number[];
  year: number;
  existingReflection: Reflection | null;
}) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();

  const [localToday, setLocalToday] = useState(serverToday);
  useEffect(() => {
    setLocalToday(getLocalDayOfYear());
  }, []);
  const isToday = day === localToday;

  function navigateDay(targetDay: number) {
    startNavigation(() => {
      router.push(`/365bible?day=${targetDay}&version=${versionCode}${compareMode ? "&compare=true" : ""}`, { scroll: false });
    });
  }

  // 체크 기능
  const [checkedDays, setCheckedDays] = useState<Set<number>>(new Set(initialCheckedDays));
  const isChecked = checkedDays.has(day);
  const isActive = user?.status === "active";

  // day가 바뀔 때만 서버 데이터로 동기화 (같은 day에서 서버 액션 후 re-render 시 덮어쓰기 방지)
  useEffect(() => {
    setCheckedDays(new Set(initialCheckedDays));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  async function handleToggleCheck() {
    if (!user || !isActive) return;
    const willCheck = !checkedDays.has(day);

    // 낙관적 업데이트
    setCheckedDays((prev) => {
      const next = new Set(prev);
      if (willCheck) next.add(day);
      else next.delete(day);
      return next;
    });

    try {
      const supabase = createClient();

      if (willCheck) {
        // upsert: 이미 있으면 무시, 없으면 삽입
        const { error } = await supabase
          .from("bible_checks")
          .upsert(
            { user_id: user.id, day, year },
            { onConflict: "user_id,day,year", ignoreDuplicates: true }
          );
        if (error) throw error;
      } else {
        // 삭제
        const { error } = await supabase
          .from("bible_checks")
          .delete()
          .eq("user_id", user.id)
          .eq("day", day)
          .eq("year", year);
        if (error) throw error;
      }
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string; details?: string };
      console.error("체크 실패:", e.message, e.code, e.details);
      // 실패 시 되돌리기
      setCheckedDays((prev) => {
        const next = new Set(prev);
        if (willCheck) next.delete(day);
        else next.add(day);
        return next;
      });
    }
  }

  // 묵상 기능
  const [reflection, setReflection] = useState<Reflection | null>(existingReflection);
  const [reflectionText, setReflectionText] = useState(existingReflection?.content ?? "");
  const [reflectionVisibility, setReflectionVisibility] = useState<"private" | "group" | "public">(existingReflection?.visibility ?? "private");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    setReflection(existingReflection);
    setReflectionText(existingReflection?.content ?? "");
    setReflectionVisibility(existingReflection?.visibility ?? "private");
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  function handleSaveReflection() {
    if (!reflectionText.trim()) return;
    startSaving(async () => {
      const result = await saveReflection(day, year, reflectionText.trim(), reflectionVisibility);
      if ("reflection" in result && result.reflection) {
        setReflection(result.reflection);
        setIsEditing(false);
      }
    });
  }

  function handleDeleteReflection() {
    if (!confirm("묵상을 삭제하시겠습니까?")) return;
    startSaving(async () => {
      const result = await deleteReflection(day, year);
      if ("deleted" in result) {
        setReflection(null);
        setReflectionText("");
        setIsEditing(false);
      }
    });
  }

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
          <button
            onClick={() => navigateDay(day - 1)}
            disabled={isNavigating}
            className="flex shrink-0 items-center rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            ← Day {day - 1}
          </button>
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
            <button
              onClick={() => navigateDay(localToday)}
              disabled={isNavigating}
              className="shrink-0 rounded bg-navy px-2 py-1 text-xs font-medium text-white hover:bg-navy/90 disabled:opacity-50"
            >
              오늘로
            </button>
          )}
        </div>

        {day < 365 ? (
          <button
            onClick={() => navigateDay(day + 1)}
            disabled={isNavigating}
            className="flex shrink-0 items-center rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            Day {day + 1} →
          </button>
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
          <div className="flex items-start justify-between gap-3">
            <p className="text-xl font-bold text-neutral-800">{displayTitle}</p>
            {user && isActive && (
              <button
                onClick={handleToggleCheck}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  isChecked
                    ? "bg-blue text-white"
                    : "border border-neutral-300 text-neutral-500 hover:border-blue hover:text-blue"
                }`}
              >
                {isChecked ? "읽음 ✓" : "읽음 체크"}
              </button>
            )}
          </div>
          {user && !isActive && (
            <p className="mt-2 text-xs text-neutral-400">
              관리자 승인 후 체크 기능을 이용할 수 있습니다.
            </p>
          )}
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

      {/* 묵상 기록 */}
      {user && isActive && (
        <section className="mt-10">
          <h3 className="mb-3 text-sm font-bold text-navy">오늘의 묵상</h3>

          {reflection && !isEditing ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                {reflection.content}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">
                    {reflectionVisibility === "private" ? "나만 보기" : reflectionVisibility === "public" ? "공개" : "소그룹 공유"}
                  </span>
                  {reflectionVisibility === "group" && (
                    <a href="/groups" className="text-xs text-blue hover:underline">
                      소그룹 피드에서 보기 &rarr;
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-neutral-500 hover:text-navy"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDeleteReflection}
                    disabled={isSaving}
                    className="text-xs text-neutral-400 hover:text-red-500"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 p-4">
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="오늘 말씀을 통해 느낀 점을 기록해보세요..."
                rows={4}
                className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-neutral-400 focus:border-navy focus:ring-1 focus:ring-navy"
              />
              <div className="mt-2 flex items-center justify-between">
                <select
                  value={reflectionVisibility}
                  onChange={(e) => setReflectionVisibility(e.target.value as "private" | "group" | "public")}
                  className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-600 outline-none"
                >
                  <option value="private">나만 보기</option>
                  <option value="group">소그룹 공유</option>
                  <option value="public">공개</option>
                </select>
                <div className="flex gap-2">
                  {(reflection || isEditing) && (
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setReflectionText(reflection?.content ?? "");
                        setReflectionVisibility(reflection?.visibility ?? "private");
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
                    >
                      취소
                    </button>
                  )}
                  <button
                    onClick={handleSaveReflection}
                    disabled={isSaving || !reflectionText.trim()}
                    className="rounded-lg bg-navy px-4 py-1.5 text-xs font-medium text-white hover:bg-navy/90 disabled:opacity-50"
                  >
                    {isSaving ? "저장 중..." : reflection ? "수정" : "저장"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 하단 네비게이션 */}
      <div className="mt-12 flex items-center justify-between border-t border-neutral-200 pt-6 pb-8">
        {day > 1 ? (
          <button
            onClick={() => navigateDay(day - 1)}
            disabled={isNavigating}
            className="text-sm text-neutral-500 hover:text-navy disabled:opacity-50"
          >
            ← 이전
          </button>
        ) : (
          <div />
        )}
        {day < 365 ? (
          <button
            onClick={() => navigateDay(day + 1)}
            disabled={isNavigating}
            className="text-sm text-neutral-500 hover:text-navy disabled:opacity-50"
          >
            다음 →
          </button>
        ) : (
          <div />
        )}
      </div>
      {/* 마지막 섹션이 짧아도 스크롤로 상단 감지 영역까지 올릴 수 있도록 여백 */}
      {sections.length > 0 && <div className="h-[60vh]" />}
    </>
  );
}
