"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { BOOK_FULL_TO_CODE } from "./plan";

type Reading = { day: number; title: string | null };

// 축약 제목용 정렬 (길이 내림차순 — 한 번만 계산)
const fullsSorted = Object.keys(BOOK_FULL_TO_CODE).sort((a, b) => b.length - a.length);

function abbreviateTitle(title: string | null): string {
  if (!title) return "";
  let t = title.normalize("NFC");
  for (const full of fullsSorted) t = t.replaceAll(full, BOOK_FULL_TO_CODE[full]);
  return t;
}

export default function ReadingPlanModal({
  readings,
  currentDay,
  versionCode,
}: {
  readings: Reading[];
  currentDay: number;
  versionCode: string;
}) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 모달이 열릴 때만 축약 제목 계산
  const abbreviated = useMemo(
    () => open ? readings.map((r) => ({ day: r.day, title: abbreviateTitle(r.title) })) : [],
    [open, readings]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // 모달 열릴 때 현재 일차 항목이 중앙에 오도록 스크롤
  useEffect(() => {
    if (!open || !listRef.current) return;
    const currentEl = listRef.current.querySelector(`[data-day="${currentDay}"]`);
    currentEl?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [open, currentDay]);

  const year = new Date().getFullYear();
  const getDateForDay = (day: number) => {
    const d = new Date(year, 0, 1);
    d.setDate(d.getDate() + day - 1);
    const weekday = d.toLocaleDateString("ko-KR", { weekday: "short" });
    return `${year}년 ${d.getMonth() + 1}월 ${d.getDate()}일(${weekday})`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-neutral-400 hover:text-blue"
        aria-label="전체 읽기표 보기"
      >
        읽기표
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reading-plan-title"
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4">
              <h2 id="reading-plan-title" className="text-lg font-bold text-navy">
                읽기표
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div ref={listRef} className="min-h-0 overflow-y-auto px-5 py-3">
              {abbreviated.map((r) => (
                <Link
                  key={r.day}
                  data-day={r.day}
                  href={`/365bible?day=${r.day}&version=${versionCode}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-baseline gap-3 rounded-lg px-3 py-2 ${
                    r.day === currentDay
                      ? "bg-blue/10 text-blue"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <span className="flex w-[11rem] shrink-0 items-baseline gap-2 text-sm">
                    <span
                      className={`min-w-[2.25rem] shrink-0 text-right font-semibold tabular-nums whitespace-nowrap ${
                        r.day === currentDay ? "text-blue" : "text-neutral-700"
                      }`}
                    >
                      {r.day}일
                    </span>
                    <span className="text-xs text-neutral-500">{getDateForDay(r.day)}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{r.title || "—"}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
