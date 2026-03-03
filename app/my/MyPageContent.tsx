"use client";

import { useState, useTransition, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { updateProfile } from "./actions";
import { saveReflection } from "@/app/365bible/actions";
import { createClient } from "@/lib/supabase/client";
import { BOOK_FULL_TO_CODE, BOOK_NAMES_ORDERED } from "@/app/365bible/plan";
import Card from "@/app/components/ui/Card";
import StatCard from "@/app/components/ui/StatCard";
import Badge from "@/app/components/ui/Badge";
import Avatar from "@/app/components/ui/Avatar";
import AvatarPicker from "./AvatarPicker";

type ReflectionSummary = {
  id: string;
  day: number;
  content: string;
  visibility: string;
  created_at: string;
};

// 연간 달력 히트맵에 사용할 날짜 정보 계산
function getDayDate(year: number, dayOfYear: number): Date {
  const yearStart = new Date(year, 0, 1);
  return new Date(yearStart.getTime() + (dayOfYear - 1) * 86400000);
}

function getMonthLabel(month: number): string {
  return ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"][month];
}

export default function MyPageContent({
  userId,
  name: initialName,
  status,
  phone: initialPhone,
  avatarUrl: initialAvatarUrl,
  year,
  today,
  checkedDays,
  reflections,
  dayToBooks,
}: {
  userId: string;
  name: string;
  status: string;
  phone: string | null;
  avatarUrl: string | null;
  year: number;
  today: number;
  checkedDays: number[];
  reflections: ReflectionSummary[];
  dayToBooks: Record<number, string[]>;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editName, setEditName] = useState(initialName);
  const [editPhone, setEditPhone] = useState(initialPhone ?? "");
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [localReflections, setLocalReflections] = useState(reflections);
  const [overflowIds, setOverflowIds] = useState<Set<string>>(new Set());
  const contentRefs = useRef<Map<string, HTMLParagraphElement>>(new Map());

  // 2줄 초과 여부 감지
  useEffect(() => {
    const next = new Set<string>();
    contentRefs.current.forEach((el, id) => {
      if (!expandedIds.has(id) && el.scrollHeight > el.clientHeight + 1) {
        next.add(id);
      }
    });
    setOverflowIds(next);
  }, [localReflections, visibleCount, searchQuery, expandedIds]);

  // 성경 구절 팝오버 (호버/터치 시 표시)
  const [versePopover, setVersePopover] = useState<{
    bookName: string;
    chapter: number;
    highlightVerse: number;
    verses: { verse: number; content: string }[];
    anchor: { top: number; bottom: number; left: number; width: number };
  } | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const verseScrollRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLParagraphElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chapterCacheRef = useRef<Map<string, { verse: number; content: string }[]>>(new Map());

  useEffect(() => {
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
  }, []);

  // 팝오버 열릴 때 해당 절로 자동 스크롤
  useEffect(() => {
    if (!verseLoading && versePopover && versePopover.verses.length > 0 && highlightRef.current && verseScrollRef.current) {
      const container = verseScrollRef.current;
      const target = highlightRef.current;
      const scrollTop = target.offsetTop - container.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
    }
  }, [verseLoading, versePopover]);

  const loadChapter = useCallback(async (bookCode: string, chapter: number) => {
    const key = `${bookCode}:${chapter}`;
    const cached = chapterCacheRef.current.get(key);
    if (cached) return cached;
    const { data } = await supabase
      .from("bible_text")
      .select("verse, content")
      .eq("book_code", bookCode)
      .eq("chapter", chapter)
      .eq("version_id", 1)
      .order("verse");
    const verses = data ?? [];
    chapterCacheRef.current.set(key, verses);
    return verses;
  }, [supabase]);

  async function handleVerseHover(book: string, chapter: number, verse: number, el: HTMLElement) {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    const rect = el.getBoundingClientRect();
    const anchor = { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width };
    setVerseLoading(true);
    setVersePopover({ bookName: book, chapter, highlightVerse: verse, verses: [], anchor });
    const bookCode = BOOK_FULL_TO_CODE[book] ?? book;
    const verses = await loadChapter(bookCode, chapter);
    setVersePopover(prev => prev ? { ...prev, verses } : null);
    setVerseLoading(false);
  }

  function scheduleClose() {
    closeTimerRef.current = setTimeout(() => setVersePopover(null), 300);
  }

  function cancelClose() {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
  }

  function getPopoverStyle(): React.CSSProperties {
    if (!versePopover) return {};
    const { anchor } = versePopover;
    const pw = 340;
    const maxH = 200;
    const gap = 8;
    const vw = typeof window !== "undefined" ? window.innerWidth : 400;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;

    let left = anchor.left + anchor.width / 2 - pw / 2;
    left = Math.max(8, Math.min(left, vw - pw - 8));

    const below = vh - anchor.bottom;
    return {
      position: "fixed",
      left,
      ...(below >= maxH + gap ? { top: anchor.bottom + gap } : { bottom: vh - anchor.top + gap }),
      width: pw,
      zIndex: 50,
    };
  }


  function highlightText(text: string, keyPrefix: string): React.ReactNode[] {
    const q = searchQuery.trim();
    if (!q) return [text];
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase()
        ? <mark key={`${keyPrefix}-hl-${i}`} className="rounded-sm bg-accent/30 text-neutral-900">{part}</mark>
        : part
    );
  }

  function renderContent(content: string): React.ReactNode {
    const pattern = /\[([가-힣a-zA-Z0-9]+ \d+:\d+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(...highlightText(content.slice(lastIndex, match.index), `t${match.index}`));
      }
      const refText = match[1];
      const refMatch = refText.match(/^(.+) (\d+):(\d+)$/);
      if (refMatch) {
        const [, refBook, refChapter, refVerse] = refMatch;
        parts.push(
          <button
            key={`ref-${match.index}`}
            onMouseEnter={(e) => { e.stopPropagation(); handleVerseHover(refBook, +refChapter, +refVerse, e.currentTarget); }}
            onMouseLeave={scheduleClose}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVerseHover(refBook, +refChapter, +refVerse, e.currentTarget); }}
            className="font-medium text-navy hover:text-navy/70"
          >
            [{refText}]
          </button>
        );
      } else {
        parts.push(...highlightText(match[0], `u${match.index}`));
      }
      lastIndex = pattern.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push(...highlightText(content.slice(lastIndex), "end"));
    }
    return parts;
  }

  const checkedSet = new Set(checkedDays);
  const reflectionDays = new Set(reflections.map((r) => r.day));
  const totalChecked = checkedDays.length;
  const percentage = today > 0 ? Math.round((totalChecked / today) * 100) : 0;

  function handleSaveProfile() {
    if (!editName.trim()) return;
    startTransition(async () => {
      const result = await updateProfile(editName.trim(), editPhone.trim());
      if ("success" in result) {
        setName(editName.trim());
        setPhone(editPhone.trim());
        setIsEditing(false);
      }
    });
  }

  // 묵상이 존재하는 책 목록 (성경 순서 유지)
  const availableBooks = useMemo(() => {
    const bookSet = new Set<string>();
    for (const r of localReflections) {
      const books = dayToBooks[r.day];
      if (books) books.forEach((b) => bookSet.add(b));
    }
    return BOOK_NAMES_ORDERED.filter((b) => bookSet.has(b));
  }, [localReflections, dayToBooks]);

  // 검색 + 책 필터 + 페이지네이션
  const filteredReflections = useMemo(() => {
    let list = localReflections;
    if (selectedBook) {
      list = list.filter((r) => (dayToBooks[r.day] ?? []).includes(selectedBook));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => r.content.toLowerCase().includes(q));
    }
    return list;
  }, [localReflections, searchQuery, selectedBook, dayToBooks]);

  const isFiltering = !!searchQuery || !!selectedBook;
  const visibleReflections = isFiltering ? filteredReflections : filteredReflections.slice(0, visibleCount);
  const hasMore = !isFiltering && visibleCount < localReflections.length;

  // 12개월로 그룹핑
  const months: { month: number; days: { day: number; checked: boolean; hasReflection: boolean; isToday: boolean; isFuture: boolean }[] }[] = [];
  let currentMonth = -1;

  for (let d = 1; d <= 365; d++) {
    const date = getDayDate(year, d);
    const m = date.getMonth();
    if (m !== currentMonth) {
      months.push({ month: m, days: [] });
      currentMonth = m;
    }
    months[months.length - 1].days.push({
      day: d,
      checked: checkedSet.has(d),
      hasReflection: reflectionDays.has(d),
      isToday: d === today,
      isFuture: d > today,
    });
  }

  return (
    <>
      {/* 승인 대기 안내 */}
      {status === "pending" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          관리자 승인 대기 중입니다. 승인 후 읽기 체크와 묵상 기록이 가능합니다.
        </div>
      )}

      {/* 프로필 요약 */}
      <Card className="mt-6">
        {isEditing ? (
          <div className="space-y-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="이름"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            />
            <input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="전화번호 (선택)"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setIsEditing(false); setEditName(name); setEditPhone(phone); }}
                className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
              >
                취소
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isPending || !editName.trim()}
                className="rounded-lg bg-navy px-4 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {isPending ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full"
              >
                <Avatar avatarUrl={avatarUrl} name={name} seed={userId} size="lg" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  변경
                </span>
              </button>
              <div>
                <p className="text-lg font-bold text-neutral-800">{name}</p>
                {phone && <p className="mt-0.5 text-xs text-neutral-400">{phone}</p>}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-neutral-400 hover:text-navy"
            >
              수정
            </button>
          </div>
        )}
      </Card>

      {/* 통계 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard value={totalChecked} label="읽은 일수" color="accent" />
        <StatCard value={`${percentage}%`} label="달성률" color="navy" />
        <StatCard value={reflections.length} label="묵상" color="neutral" />
      </div>

      {/* 연간 캘린더 히트맵 */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy">{year}년 읽기 현황</h2>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-[10px] w-[10px] rounded-sm bg-neutral-200" /> 미읽음
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-[10px] w-[10px] rounded-sm bg-accent/60" /> 읽음
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-[10px] w-[10px] rounded-sm bg-accent" /> 묵상
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {months.map(({ month, days }) => (
            <div key={month}>
              <p className="mb-1 text-xs font-medium text-neutral-500">{getMonthLabel(month)}</p>
              <div className="flex flex-wrap gap-[3px]">
                {days.map((d) => (
                  <Link
                    key={d.day}
                    href={`/365bible?day=${d.day}`}
                    title={`Day ${d.day}${d.checked ? " (읽음)" : ""}${d.hasReflection ? " (묵상)" : ""}`}
                    className={`h-[14px] w-[14px] rounded-sm transition-colors ${
                      d.isToday ? "ring-2 ring-accent ring-offset-1" : ""
                    } ${
                      d.isFuture
                        ? "bg-neutral-100"
                        : d.hasReflection
                          ? "bg-accent"
                          : d.checked
                            ? "bg-accent/60"
                            : "bg-neutral-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 묵상 목록 (검색 + 페이지네이션 — 단일 카드) */}
      <section className="mt-10">
        <h2 className="mb-4 text-sm font-bold text-navy">묵상 기록</h2>
        {reflections.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm">
            아직 작성한 묵상이 없습니다
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {/* 검색 + 책 필터 */}
            <div className="flex items-center gap-2 px-4 py-2.5">
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(10); }}
                  placeholder="묵상 내용 검색"
                  className="w-full bg-transparent py-1 pl-6 pr-6 text-sm outline-none placeholder:text-neutral-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              {availableBooks.length > 0 && (
                <select
                  value={selectedBook}
                  onChange={(e) => { setSelectedBook(e.target.value); setVisibleCount(10); }}
                  className="shrink-0 rounded-lg bg-transparent px-2 py-1.5 text-xs text-neutral-600 outline-none"
                >
                  <option value="">전체</option>
                  {availableBooks.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              )}
            </div>

            {/* 검색/필터 결과 없음 */}
            {isFiltering && filteredReflections.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-neutral-400">검색 결과가 없습니다</p>
            )}

            {/* 목록 */}
            {visibleReflections.map((r) => {
              const isOpen = expandedIds.has(r.id);
              const isEditing = editingId === r.id;
              return (
                <div key={r.id} className="group/row flex items-start gap-3 px-4 py-1.5 transition-colors hover:bg-accent-light/50 active:bg-accent-light/50">
                  <Link href={`/365bible?day=${r.day}`} className="shrink-0 mt-0.5 transition-opacity hover:opacity-70">
                    <Badge variant="accent">Day {r.day}</Badge>
                  </Link>
                  <div className="relative min-w-0 flex-1">
                    {isEditing ? (
                      <>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={5}
                          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm leading-relaxed text-neutral-700 outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                        />
                        <div className="mt-1.5 flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
                          >
                            취소
                          </button>
                          <button
                            disabled={editSaving || !editContent.trim()}
                            onClick={async () => {
                              setEditSaving(true);
                              const result = await saveReflection(r.day, year, editContent.trim(), r.visibility as "private" | "group" | "public");
                              if ("reflection" in result) {
                                setLocalReflections(prev => prev.map(x => x.id === r.id ? { ...x, content: editContent.trim() } : x));
                                setEditingId(null);
                              }
                              setEditSaving(false);
                            }}
                            className="rounded-lg bg-navy px-4 py-1 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                          >
                            {editSaving ? "저장 중..." : "저장"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p
                          ref={(el) => { if (el) contentRefs.current.set(r.id, el); else contentRefs.current.delete(r.id); }}
                          onClick={() => { if (isOpen || overflowIds.has(r.id)) setExpandedIds(prev => { const next = new Set(prev); if (next.has(r.id)) next.delete(r.id); else next.add(r.id); return next; }); }}
                          className={`text-sm leading-relaxed text-neutral-700 pr-5 ${
                            isOpen || searchQuery ? "whitespace-pre-line" : "line-clamp-2"
                          } ${isOpen || overflowIds.has(r.id) ? "cursor-pointer" : ""}`}
                        >
                          {renderContent(r.content)}
                        </p>
                        {(isOpen || overflowIds.has(r.id)) && (
                          <button
                            onClick={() => setExpandedIds(prev => { const next = new Set(prev); if (next.has(r.id)) next.delete(r.id); else next.add(r.id); return next; })}
                            className="absolute top-0 right-0 text-neutral-400 hover:text-navy"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        <div className="flex justify-end">
                          <button
                            onClick={() => { setEditingId(r.id); setEditContent(r.content); setExpandedIds(prev => new Set(prev).add(r.id)); }}
                            className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs text-accent-dark opacity-0 transition-opacity hover:bg-accent/30 group-hover/row:opacity-100 group-active/row:opacity-100"
                          >
                            수정
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 더 보기 */}
            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="w-full py-3 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-navy"
              >
                더 보기 ({visibleCount}/{reflections.length})
              </button>
            )}
          </div>
        )}
      </section>

      {/* 성경 구절 팝오버 */}
      {versePopover && (
        <>
          {/* 모바일 백드롭 (터치로 닫기) */}
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setVersePopover(null)} />
          <div
            style={getPopoverStyle()}
            className="rounded-xl bg-white shadow-lg ring-1 ring-black/5"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <div className="px-3 pt-2.5 pb-1">
              <p className="text-sm font-bold text-navy">{versePopover.bookName} {versePopover.chapter}장</p>
            </div>
            <div ref={verseScrollRef} className="overflow-y-auto overscroll-contain px-3 pb-2.5" style={{ maxHeight: 180 }}>
              {verseLoading ? (
                <div className="flex justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" />
                </div>
              ) : versePopover.verses.length === 0 ? (
                <p className="py-3 text-center text-sm text-neutral-400">구절을 찾을 수 없습니다</p>
              ) : (
                <div className="space-y-0.5">
                  {versePopover.verses.map((v) => {
                    const isHighlight = v.verse === versePopover.highlightVerse;
                    return (
                      <p
                        key={v.verse}
                        ref={isHighlight ? highlightRef : undefined}
                        className={`rounded px-1.5 py-0.5 text-sm leading-relaxed ${
                          isHighlight ? "bg-accent-light font-medium text-neutral-900" : "text-neutral-600"
                        }`}
                      >
                        <span className={`mr-1 text-xs font-medium ${isHighlight ? "text-accent" : "text-neutral-400"}`}>
                          {v.verse}
                        </span>
                        {v.content}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showAvatarPicker && (
        <AvatarPicker
          currentAvatarUrl={avatarUrl}
          name={name}
          seed={userId}
          onClose={() => setShowAvatarPicker(false)}
          onSave={(newUrl) => { setAvatarUrl(newUrl); setShowAvatarPicker(false); }}
        />
      )}
    </>
  );
}
