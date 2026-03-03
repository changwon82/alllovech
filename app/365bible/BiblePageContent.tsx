"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import YouTubePlayer from "./YouTubePlayer";
import TextSizeControl from "./TextSizeControl";
import { saveReflection, deleteReflection, type Reflection } from "./actions";
import { BOOK_FULL_TO_CODE } from "./plan";
import { createClient } from "@/lib/supabase/client";
import LoginButton from "./LoginButton";

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

function ScrollToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-24 left-1/2 z-40 hidden h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-navy text-white shadow-lg transition-all hover:brightness-110 active:scale-95 md:flex"
      aria-label="위로"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
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
  compareVersionCode,
  compareVersionName,
  user,
  checkedDays: initialCheckedDays,
  year,
  existingReflection,
  canViewGroups = false,
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
  compareVersionCode?: string;
  compareVersionName?: string;
  user: UserInfo;
  checkedDays: number[];
  year: number;
  existingReflection: Reflection | null;
  canViewGroups?: boolean;
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
      const cw = compareMode && compareVersionCode ? `&compareWith=${compareVersionCode}` : "";
      router.push(`/365bible?day=${targetDay}&version=${versionCode}${compareMode ? "&compare=true" : ""}${cw}`, { scroll: false });
    });
  }

  // 병행보기 비교 번역본 기억
  useEffect(() => {
    if (compareMode && compareVersionCode) {
      localStorage.setItem("bible-compare-with", compareVersionCode);
    }
  }, [compareMode, compareVersionCode]);

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
    setReflectionOpen(false);
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

  // 묵상 모달
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflectionFocused, setReflectionFocused] = useState(false);
  const reflectionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 절 클릭 → textarea에 약식 참조 삽입
  function insertVerseReference(book: string, chapter: number, verse: number) {
    const shortBook = BOOK_FULL_TO_CODE[book] ?? book;
    const ref = `[${shortBook} ${chapter}:${verse}]`;
    const ta = reflectionTextareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newText = reflectionText.slice(0, start) + ref + reflectionText.slice(end);
      setReflectionText(newText);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + ref.length;
        ta.setSelectionRange(pos, pos);
      });
    } else {
      setReflectionText((prev) => prev + ref);
    }
  }

  // 읽기 모드에서 [약식이름 장:절] 참조를 링크로 렌더링
  const codeToFull = useRef(
    Object.fromEntries(Object.entries(BOOK_FULL_TO_CODE).map(([full, code]) => [code, full]))
  ).current;

  function renderReflectionContent(content: string) {
    const pattern = /\[([가-힣a-zA-Z0-9]+ \d+:\d+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      const refText = match[1];
      const refMatch = refText.match(/^(.+) (\d+):(\d+)$/);
      if (refMatch) {
        const [, refBook, refChapter, refVerse] = refMatch;
        // 약식이름이면 원래 이름으로 변환하여 id 검색 (원래 이름이면 그대로 사용)
        const fullBook = codeToFull[refBook] ?? refBook;
        parts.push(
          <button
            key={`ref-${match.index}`}
            onClick={() => {
              const el = document.getElementById(`v-${fullBook}-${refChapter}-${refVerse}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("bg-accent-light");
                setTimeout(() => el.classList.remove("bg-accent-light"), 5000);
              }
            }}
            className="font-medium text-navy underline underline-offset-2 hover:text-navy/70"
          >
            [{refText}]
          </button>
        );
      } else {
        parts.push(match[0]);
      }
      lastIndex = pattern.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    return parts;
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
        className={`fixed top-0 right-0 left-0 z-50 bg-white/95 shadow-sm backdrop-blur-sm transition-transform duration-200 ${
          showSticky ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
          <span className={`shrink-0 text-sm font-bold ${isToday ? "text-accent" : "text-neutral-800"}`}>
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
          isToday ? "text-accent" : "text-neutral-800"
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
            className="flex shrink-0 items-center rounded-lg bg-white px-3 py-2 text-sm text-neutral-600 shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            ← Day {day - 1}
          </button>
        ) : (
          <div className="w-20 shrink-0" />
        )}

        <div
          className={`flex min-w-0 flex-1 flex-nowrap items-center justify-center gap-2 rounded-lg px-2 py-2 sm:px-3 ${
            isToday ? "bg-accent-light font-medium text-accent" : "bg-white text-neutral-700 shadow-sm"
          }`}
        >
          <span className="min-w-0 shrink truncate text-xs whitespace-nowrap sm:text-sm">
            {dateStr} ({weekdayStr})
          </span>
          {!isToday ? (
            <button
              onClick={() => navigateDay(localToday)}
              disabled={isNavigating}
              className="shrink-0 rounded bg-navy px-1.5 py-0.5 text-[11px] font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              오늘로
            </button>
          ) : null}
        </div>

        {day < 365 ? (
          <button
            onClick={() => navigateDay(day + 1)}
            disabled={isNavigating}
            className="flex shrink-0 items-center rounded-lg bg-white px-3 py-2 text-sm text-neutral-600 shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            Day {day + 1} →
          </button>
        ) : (
          <div className="w-20 shrink-0" />
        )}
      </div>

      {!user && (
        <div className="mt-3 text-center">
          <LoginButton className="text-xs text-neutral-400 hover:text-navy">
            읽기체크·묵상기록 등은 <span className="text-navy underline">로그인</span> 후 이용 가능
          </LoginButton>
        </div>
      )}

      {/* 읽기 정보 */}
      {reading ? (
        <section
          ref={infoRef}
          className={`mt-4 rounded-2xl p-5 md:p-6 ${
            isToday ? "bg-accent-light" : "bg-white shadow-sm"
          }`}
        >
          <p className="text-xl font-bold text-neutral-800">{displayTitle}</p>
          {reading?.youtube_id && (
            <div className="mt-4">
              <YouTubePlayer key={reading.youtube_id} videoId={reading.youtube_id} />
            </div>
          )}
        </section>
      ) : (
        <section ref={infoRef} className="mt-4 rounded-2xl bg-white p-6 text-center text-neutral-500 shadow-sm">
          읽기표를 불러올 수 없습니다
        </section>
      )}

      {/* 성경 본문 */}
      {sections.length > 0 && (
        <section className="mt-8">
          <TextSizeControl
            headerLeft={
              versions.length > 0 ? (
                !user ? (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-navy px-3 py-1 text-xs font-medium text-white">개역개정</span>
                    <span className="text-sm text-neutral-400">로그인 후 타번역(새번역 등) 병행보기 가능</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[...versions].sort((a, b) => {
                      const order: Record<string, number> = { KRV: 0, NKRV: 1, SAENEW: 2 };
                      return (order[a.code] ?? 9) - (order[b.code] ?? 9);
                    }).map((v) => {
                      const isPrimary = v.code === versionCode;
                      const isCompare = compareMode && v.code === compareVersionCode;

                      // 클릭 시 URL 결정
                      let href: string;
                      if (isPrimary && !compareMode) {
                        // 이미 선택된 주 번역본 — 변경 없음
                        href = `/365bible?day=${day}&version=${v.code}`;
                      } else if (compareMode && !isPrimary) {
                        // 병행보기 중 다른 번역본 클릭 → 비교 대상 변경
                        href = `/365bible?day=${day}&version=${versionCode}&compare=true&compareWith=${v.code}`;
                      } else {
                        // 주 번역본 변경
                        const cw = compareMode && compareVersionCode && compareVersionCode !== v.code
                          ? `&compareWith=${compareVersionCode}` : "";
                        href = `/365bible?day=${day}&version=${v.code}${compareMode ? "&compare=true" : ""}${cw}`;
                      }

                      return (
                        <Link
                          key={v.code}
                          href={href}
                          scroll={false}
                          className={
                            isPrimary
                              ? "rounded-full bg-navy px-3 py-1 text-xs font-medium text-white"
                              : isCompare
                                ? "rounded-full bg-blue px-3 py-1 text-xs font-medium text-white"
                                : "rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                          }
                        >
                          {v.name}
                        </Link>
                      );
                    })}
                    {versions.length > 1 && (
                      <button
                        onClick={() => {
                          if (compareMode) {
                            router.push(`/365bible?day=${day}&version=${versionCode}`, { scroll: false });
                          } else {
                            const saved = localStorage.getItem("bible-compare-with");
                            const cw = saved && saved !== versionCode ? saved : "";
                            router.push(`/365bible?day=${day}&version=${versionCode}&compare=true${cw ? `&compareWith=${cw}` : ""}`, { scroll: false });
                          }
                        }}
                        className={
                          compareMode
                            ? "rounded-full bg-blue px-3 py-1 text-xs font-medium text-white"
                            : "rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                        }
                      >
                        병행보기
                      </button>
                    )}
                  </div>
                )
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
                    <div
                      key={`${v.book}-${v.chapter}-${v.verse}`}
                      id={`v-${v.book}-${v.chapter}-${v.verse}`}
                      onClick={reflectionOpen && (isEditing || !reflection) ? () => insertVerseReference(v.book, v.chapter, v.verse) : undefined}
                      className={`rounded transition-colors duration-700${reflectionOpen && (isEditing || !reflection) ? " cursor-pointer active:bg-accent-light" : ""}`}
                    >
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
                            <span className="mt-1 block text-[0.94em] text-blue">
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

      {/* 마지막 섹션이 짧아도 스크롤로 상단 감지 영역까지 올릴 수 있도록 여백 */}
      {sections.length > 0 && <div className="h-[60vh]" />}

      {/* 묵상 모달 */}
      {user && isActive && (
        <>
          {/* 플로팅 버튼 (묵상 모달 열리면 반투명) */}
          <div className={`fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 transition-opacity ${reflectionOpen ? "pointer-events-none opacity-40" : "opacity-100"}`}>
            <button
              onClick={handleToggleCheck}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-all active:scale-95 ${
                isChecked
                  ? "bg-accent text-white"
                  : "border border-neutral-300 bg-white text-neutral-600 hover:border-accent hover:text-accent"
              }`}
            >
              {isChecked ? "읽음 ✓" : "읽음 체크"}
            </button>
            <button
              onClick={() => isChecked && setReflectionOpen(true)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-all active:scale-95 ${
                !isChecked
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  : reflection
                    ? "bg-accent text-white"
                    : "border border-neutral-300 bg-white text-neutral-600 hover:border-accent hover:text-accent"
              }`}
            >
              {reflection ? "묵상 ✓" : "묵상 기록"}
            </button>
          </div>

          {/* 펼친 상태: 모달 */}
          {reflectionOpen && (
            <div
              style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 60px)" }}
              className={`fixed right-3 left-3 z-[60] flex max-h-[320px] flex-col rounded-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-all duration-200 md:right-auto md:left-1/2 md:w-[80%] md:max-w-2xl md:-translate-x-1/2 ${
                isEditing || (!reflection && (reflectionFocused || reflectionText.trim()))
                  ? "bg-white"
                  : "bg-white/70 backdrop-blur-sm"
              }`}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <span className="text-sm font-bold text-navy">오늘의 묵상</span>
                <button
                  onClick={() => {
                    setReflectionOpen(false);
                    setIsEditing(false);
                    setReflectionText(reflection?.content ?? "");
                    setReflectionVisibility(reflection?.visibility ?? "private");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 내용 */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                {reflection && !isEditing ? (
                  <div className="max-h-[5.6rem] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                    {renderReflectionContent(reflection.content)}
                  </div>
                ) : (
                  <textarea
                    ref={reflectionTextareaRef}
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    onFocus={() => setReflectionFocused(true)}
                    onBlur={() => setReflectionFocused(false)}
                    placeholder="오늘 말씀을 통해 느낀 점을 기록해보세요..."
                    rows={4}
                    className="w-full resize-none bg-transparent text-sm leading-relaxed text-neutral-700 outline-none placeholder:text-neutral-400"
                  />
                )}
              </div>

              {/* 하단 고정: 액션 버튼 */}
              <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5">
                {reflection && !isEditing ? (
                  <>
                    <span className="text-xs text-neutral-400">
                      {reflectionVisibility === "private" ? "나만 보기" : reflectionVisibility === "public" ? "공개" : "함께읽기 공유"}
                    </span>
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
                  </>
                ) : (
                  <>
                    {canViewGroups ? (
                      <select
                        value={reflectionVisibility}
                        onChange={(e) => setReflectionVisibility(e.target.value as "private" | "group" | "public")}
                        className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-600 outline-none"
                      >
                        <option value="private">나만 보기</option>
                        <option value="group">함께읽기 공유</option>
                        <option value="public">공개</option>
                      </select>
                    ) : (
                      <span className="text-xs text-neutral-400">나만 보기</span>
                    )}
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
                        className="rounded-lg bg-navy px-4 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? "저장 중..." : reflection ? "수정" : "저장"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* 플로팅 위로 버튼 */}
      <ScrollToTopButton />

    </>
  );
}
