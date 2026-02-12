import { createClient } from "@/src/lib/supabase/server";
import ReadingPlanModal from "./ReadingPlanModal";
import BiblePageContent from "./BiblePageContent";
import RedirectToLocalToday from "./RedirectToLocalToday";

export const metadata = {
  title: "365 성경읽기 | 다애교회",
  openGraph: {
    title: "365 성경읽기 | 다애교회",
    description: "365 성경읽기",
    images: ["/logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "365 성경읽기 | 다애교회",
    description: "365 성경읽기",
  },
};

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

type VerseRange = {
  chapter: number;
  startVerse?: number;
  endVerse?: number;
};
type Section = {
  book: string;
  ranges: VerseRange[];
};
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

function expandRange(start: number, end: number): VerseRange[] {
  if (end < start) return [{ chapter: start }];
  return Array.from({ length: end - start + 1 }, (_, i) => ({ chapter: start + i }));
}

function parseChapterRefs(str: string): VerseRange[] {
  const trimmed = str.trim();
  const has장 = /장/.test(trimmed);
  const clean = trimmed.replace(/장.*$/, "").replace(/[a-z]/g, "").trim();

  // 1. "N:V-M:V" (양쪽에 콜론 → 장을 넘나드는 절 범위)
  const crossCh = clean.match(/^(\d+):(\d+)\s*-\s*(\d+):(\d+)$/);
  if (crossCh) {
    const [, startCh, startV, endCh, endV] = crossCh;
    const ranges: VerseRange[] = [];
    for (let c = +startCh; c <= +endCh; c++) {
      const r: VerseRange = { chapter: c };
      if (c === +startCh) r.startVerse = +startV;
      if (c === +endCh) r.endVerse = +endV;
      ranges.push(r);
    }
    return ranges;
  }

  // 2. "N:V-M장" (has장 + 콜론 → 시작 절부터 끝 장까지)
  if (has장 && clean.includes(":")) {
    const m = clean.match(/^(\d+):(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const [, startCh, startV, endCh] = m;
      const ranges: VerseRange[] = [];
      for (let c = +startCh; c <= +endCh; c++) {
        const r: VerseRange = { chapter: c };
        if (c === +startCh) r.startVerse = +startV;
        ranges.push(r);
      }
      return ranges;
    }
  }

  // 3. "N-M:V" (콜론이 오른쪽에만 → 시작 장부터 끝 장:절까지) — 버그 수정
  const nMV = clean.match(/^(\d+)\s*-\s*(\d+):(\d+)$/);
  if (nMV) {
    const [, startCh, endCh, endV] = nMV;
    const ranges: VerseRange[] = [];
    for (let c = +startCh; c <= +endCh; c++) {
      const r: VerseRange = { chapter: c };
      if (c === +endCh) r.endVerse = +endV;
      ranges.push(r);
    }
    return ranges;
  }

  // 콜론 없음 → 장 참조
  if (!clean.includes(":")) {
    // 4. "N-M"
    const range = clean.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) return expandRange(+range[1], +range[2]);
    // 5. "N"
    const num = clean.match(/^(\d+)$/);
    if (num) return [{ chapter: +num[1] }];
    return [];
  }

  // 6. "N:V-V" (절 범위)
  const verseRange = clean.match(/^(\d+):(\d+)\s*-\s*(\d+)$/);
  if (verseRange) return [{ chapter: +verseRange[1], startVerse: +verseRange[2], endVerse: +verseRange[3] }];

  // 7. "N:V" (단일 절)
  const singleVerse = clean.match(/^(\d+):(\d+)$/);
  if (singleVerse) return [{ chapter: +singleVerse[1], startVerse: +singleVerse[2], endVerse: +singleVerse[2] }];

  return [];
}

function parseTitle(title: string): Section[] {
  const normalized = title.replace(/(\d)편/g, "$1장");
  const segments = normalized.split(",").map((s) => s.trim());

  const result: Section[] = [];
  let currentBook = "";

  for (const segment of segments) {
    let book = "";
    let rest = segment;

    // 띄어쓰기 있는 책 이름: "삼상 25-26장"
    const withSpace = segment.match(/^([가-힣]+)\s+(\d.*)$/);
    // 띄어쓰기 없는 책 이름: "요1-2:12"
    const noSpace = segment.match(/^([가-힣]+)(\d.*)$/);

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
    const ranges = parseChapterRefs(rest);

    if (ranges.length > 0) {
      result.push({ book, ranges });
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
  let displaySections: DisplaySection[] = [];

  if (reading) {
    const sections = parseTitle(reading.title);

    // 장 출현 횟수 계산 (같은 책·장이 여러 섹션에 나오면 범위만 표시)
    const chapterCount = new Map<string, number>();
    for (const s of sections)
      for (const r of s.ranges)
        chapterCount.set(`${s.book}|${r.chapter}`, (chapterCount.get(`${s.book}|${r.chapter}`) ?? 0) + 1);

    // 필요한 장 수집 (책별)
    const chaptersPerBook = new Map<string, Set<number>>();
    for (const s of sections)
      for (const r of s.ranges) {
        if (!chaptersPerBook.has(s.book)) chaptersPerBook.set(s.book, new Set());
        chaptersPerBook.get(s.book)!.add(r.chapter);
      }

    // Supabase 쿼리 (책별 1회)
    const allVerses = new Map<string, Map<number, { book: string; chapter: number; verse: number; heading: string | null; content: string }[]>>();
    for (const [book, chapters] of chaptersPerBook) {
      const bookCode = fullToCode[book] ?? book;
      const { data } = await supabase
        .from("bible_text")
        .select("book, chapter, verse, heading, content")
        .eq("book_code", bookCode)
        .in("chapter", [...chapters])
        .eq("version", "개역개정")
        .order("chapter")
        .order("verse");
      const byChapter = new Map<number, typeof data>();
      for (const v of data || []) {
        if (!byChapter.has(v.chapter)) byChapter.set(v.chapter, []);
        byChapter.get(v.chapter)!.push(v);
      }
      allVerses.set(book, byChapter as Map<number, { book: string; chapter: number; verse: number; heading: string | null; content: string }[]>);
    }

    // DisplaySection[] 조립
    for (const section of sections) {
      for (const range of section.ranges) {
        const chapterVerses = allVerses.get(section.book)?.get(range.chapter) || [];
        const appearances = chapterCount.get(`${section.book}|${range.chapter}`) ?? 1;
        const hasRange = range.startVerse != null || range.endVerse != null;
        const isMulti = appearances > 1;

        if (!hasRange) {
          // 전체 장 → 모두 highlighted
          displaySections.push({
            book: section.book,
            chapter: range.chapter,
            showFullChapter: true,
            verses: chapterVerses.map((v) => ({ ...v, highlighted: true })),
          });
        } else if (isMulti) {
          // 같은 장 여러 번 → 해당 절만 표시 (회색 문맥 없음)
          const start = range.startVerse ?? 1;
          const end = range.endVerse ?? Infinity;
          const filtered = chapterVerses.filter((v) => v.verse >= start && v.verse <= end);
          displaySections.push({
            book: section.book,
            chapter: range.chapter,
            startVerse: range.startVerse,
            endVerse: range.endVerse,
            showFullChapter: false,
            verses: filtered.map((v) => ({ ...v, highlighted: true })),
          });
        } else {
          // 장 1회 + 절 범위 → 전체 장 표시, 범위 밖 회색
          const start = range.startVerse ?? 1;
          const end = range.endVerse ?? Infinity;
          displaySections.push({
            book: section.book,
            chapter: range.chapter,
            startVerse: range.startVerse,
            endVerse: range.endVerse,
            showFullChapter: true,
            verses: chapterVerses.map((v) => ({
              ...v,
              highlighted: v.verse >= start && v.verse <= end,
            })),
          });
        }
      }
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
        sections={displaySections}
        serverToday={serverToday}
      />
    </div>
  );
}
