"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import YouTubePlayer from "./YouTubePlayer";
import TextSizeControl from "./TextSizeControl";

function getLocalDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

type Verse = { book: string; chapter: number; verse: number; heading: string | null; content: string };
type Reading = { day: number; title: string | null; youtube_id: string | null };

const BIBLE_VERSION = "개역개정";

export default function BiblePageContent({
  day,
  dayDateIso,
  reading,
  displayTitle,
  verses,
  serverToday,
}: {
  day: number;
  dayDateIso: string;
  reading: Reading | null;
  displayTitle: string;
  verses: Verse[];
  serverToday: number;
}) {
  const [localToday, setLocalToday] = useState(serverToday);
  useEffect(() => {
    setLocalToday(getLocalDayOfYear());
  }, []);
  const isToday = day === localToday;

  const dayDate = new Date(dayDateIso);
  const dateStr = dayDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekdayStr = dayDate.toLocaleDateString("ko-KR", { weekday: "short" });

  return (
    <>
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
          className={`mt-4 rounded-2xl border p-5 md:p-6 ${
            isToday ? "border-blue/20 bg-blue/5" : "border-neutral-200 bg-neutral-50"
          }`}
        >
          <p className="text-xl font-bold text-neutral-800">{displayTitle}</p>
        </section>
      ) : (
        <section className="mt-4 rounded-2xl border border-neutral-200 p-6 text-center text-neutral-500">
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
      {verses.length > 0 && (
        <section className="mt-8">
          <TextSizeControl version={BIBLE_VERSION}>
            {verses.map((v, i) => {
              const showChapterHeader =
                i === 0 ||
                verses[i - 1].chapter !== v.chapter ||
                verses[i - 1].book !== v.book;

              return (
                <div key={`${v.book}-${v.chapter}-${v.verse}`}>
                  {showChapterHeader && (
                    <h2
                      className={`${i === 0 ? "mt-0" : "mt-10"} mb-4 border-b border-neutral-200 pb-2 text-lg font-bold text-navy`}
                    >
                      {v.book.normalize("NFC")} {v.chapter}장
                    </h2>
                  )}
                  {v.heading && (
                    <p className="mt-5 mb-2 font-bold text-blue">{v.heading}</p>
                  )}
                  <p className="mt-3 flex text-neutral-700">
                    <span className="mr-1.5 mt-[0.3em] min-w-[1.5em] shrink-0 text-right text-[0.75em] font-medium text-neutral-400">
                      {v.verse}
                    </span>
                    <span>{v.content}</span>
                  </p>
                </div>
              );
            })}
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
    </>
  );
}
