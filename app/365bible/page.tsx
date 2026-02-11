import { createClient } from "@/src/lib/supabase/server";
import ReadingPlanModal from "./ReadingPlanModal";
import BiblePageContent from "./BiblePageContent";
import RedirectToLocalToday from "./RedirectToLocalToday";

export const metadata = {
  title: "365 성경읽기 | 다애교회",
};

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

type BookChapters = { book: string; chapters: number[] };

function expandRange(start: number, end: number): number[] {
  if (end < start) return [start];
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function parseChapterRefs(str: string): number[] {
  const trimmed = str.trim();
  const has장 = /장/.test(trimmed);
  const clean = trimmed.replace(/장.*$/, "").replace(/[a-z]/g, "").trim();

  // "N:V-M:V" (양쪽에 콜론 → 장을 넘나드는 절 범위)
  const crossCh = clean.match(/^(\d+):\d+\s*-\s*(\d+):\d+/);
  if (crossCh) return expandRange(+crossCh[1], +crossCh[2]);

  // 콜론 없음 → 장 참조
  if (!clean.includes(":")) {
    const range = clean.match(/^(\d+)\s*-\s*(\d+)/);
    if (range) return expandRange(+range[1], +range[2]);
    const num = clean.match(/^(\d+)/);
    if (num) return [+num[1]];
    return [];
  }

  // "N:V-M장" (장 표시 있음 → 장을 넘나드는 범위)
  if (has장) {
    const m = clean.match(/^(\d+):\d+\s*-\s*(\d+)/);
    if (m) return expandRange(+m[1], +m[2]);
  }

  // "N:V-V" 또는 "N:V" (절 범위 → 해당 장만)
  const m = clean.match(/^(\d+)/);
  if (m) return [+m[1]];
  return [];
}

function parseTitle(title: string): BookChapters[] {
  const normalized = title.replace(/(\d)편/g, "$1장");
  const sections = normalized.split(",").map((s) => s.trim());

  const result: BookChapters[] = [];
  let currentBook = "";

  for (const section of sections) {
    let book = "";
    let rest = section;

    // 띄어쓰기 있는 책 이름: "삼상 25-26장"
    const withSpace = section.match(/^([가-힣]+)\s+(\d.*)$/);
    // 띄어쓰기 없는 책 이름: "요1-2:12"
    const noSpace = section.match(/^([가-힣]+)(\d.*)$/);

    if (withSpace) {
      book = withSpace[1].trim().normalize("NFC");
      rest = withSpace[2];
    } else if (noSpace) {
      book = noSpace[1].trim().normalize("NFC");
      rest = noSpace[2];
    } else if (currentBook) {
      book = currentBook;
    } else {
      continue;
    }

    currentBook = book;
    const chapters = parseChapterRefs(rest);

    if (chapters.length > 0) {
      const existing = result.find((r) => r.book === book);
      if (existing) {
        existing.chapters.push(...chapters);
      } else {
        result.push({ book, chapters });
      }
    }
  }

  return result;
}

export default async function BiblePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const serverToday = getDayOfYear();

  // URL에 day가 없으면 클라이언트에서 지역 기준 오늘 일차로 리다이렉트
  if (!params.day) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-8 md:pt-4 md:pb-12">
        <div className="mt-2 flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-navy md:text-3xl">365 성경읽기</h1>
        </div>
        <div className="mt-2 h-1 w-12 rounded bg-blue" />
        <RedirectToLocalToday />
      </div>
    );
  }

  const day = Math.max(1, Math.min(365, parseInt(params.day)));
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const dayDate = new Date(yearStart.getTime() + (day - 1) * 86400000);

  // 읽기표 (해당 일차)
  const { data: reading } = await supabase
    .from("bible_readings")
    .select("day, title, youtube_id")
    .eq("day", day)
    .single();

  // 전체 365일 읽기표 (모달용)
  const { data: allReadings } = await supabase
    .from("bible_readings")
    .select("day, title")
    .order("day");

  // 전체명 → 약어 매핑 (각 책 1:1 절만 조회 → 66행)
  const { data: bookPairs } = await supabase
    .from("bible_text")
    .select("book, book_code")
    .eq("chapter", 1)
    .eq("verse", 1)
    .eq("version", "개역개정");
  const fullToCode: Record<string, string> = {};
  for (const p of bookPairs || []) {
    if (p.book && p.book_code) fullToCode[p.book.normalize("NFC")] = p.book_code;
  }

  // 본문 가져오기
  let verses: { book: string; chapter: number; verse: number; heading: string | null; content: string }[] = [];

  if (reading) {
    const readings = parseTitle(reading.title);
    for (const r of readings) {
      const bookCode = fullToCode[r.book] ?? r.book;
      const { data } = await supabase
        .from("bible_text")
        .select("book, chapter, verse, heading, content")
        .eq("book_code", bookCode)
        .in("chapter", r.chapters)
        .eq("version", "개역개정")
        .order("chapter")
        .order("verse");
      verses.push(...(data || []));
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-8 md:pt-4 md:pb-12">
      <div className="mt-2 flex items-baseline gap-2">
        <h1 className="text-2xl font-bold text-navy md:text-3xl">
          365 성경읽기
        </h1>
        {allReadings && allReadings.length > 0 && (
          <ReadingPlanModal
            readings={allReadings.map((r) => {
              let title = (r.title ?? "").normalize("NFC");
              const fulls = Object.keys(fullToCode).sort((a, b) => b.length - a.length);
              for (const full of fulls) title = title.replaceAll(full, fullToCode[full]);
              return { day: r.day, title };
            })}
            currentDay={day}
          />
        )}
      </div>
      <div className="mt-2 h-1 w-12 rounded bg-blue" />

      <BiblePageContent
        day={day}
        dayDateIso={dayDate.toISOString()}
        reading={reading}
        displayTitle={(reading?.title ?? "").normalize("NFC")}
        verses={verses}
        serverToday={serverToday}
      />
    </div>
  );
}
