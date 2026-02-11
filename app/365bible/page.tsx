import Link from "next/link";
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

const BOOK_MAP: Record<string, string> = {
  창세기: "창세기", 출애굽기: "출애굽기", 레위기: "레위기", 민수기: "민수기", 신명기: "신명기",
  여호수아: "여호수아", 사사기: "사사기", 룻기: "룻기",
  사무엘상: "사무엘상", 사무엘하: "사무엘하", 열왕기상: "열왕기상", 열왕기하: "열왕기하",
  역대상: "역대상", 역대하: "역대하", 에스라: "에스라", 느헤미야: "느헤미야", 에스더: "에스더",
  욥기: "욥기", 시편: "시편", 잠언: "잠언", 전도서: "전도서", 아가: "아가",
  이사야: "이사야", 예레미야: "예레미야", 예레미야애가: "예레미야애가",
  에스겔: "에스겔", 다니엘: "다니엘",
  호세아: "호세아", 요엘: "요엘", 아모스: "아모스", 오바댜: "오바댜", 요나: "요나",
  미가: "미가", 나훔: "나훔", 하박국: "하박국", 스바냐: "스바냐", 학개: "학개",
  스가랴: "스가랴", 말라기: "말라기",
  마태복음: "마태복음", 마가복음: "마가복음", 누가복음: "누가복음", 요한복음: "요한복음",
  사도행전: "사도행전", 로마서: "로마서",
  고린도전서: "고린도전서", 고린도후서: "고린도후서",
  갈라디아서: "갈라디아서", 에베소서: "에베소서", 빌립보서: "빌립보서", 골로새서: "골로새서",
  데살로니가전서: "데살로니가전서", 데살로니가후서: "데살로니가후서",
  디모데전서: "디모데전서", 디모데후서: "디모데후서", 디도서: "디도서", 빌레몬서: "빌레몬서",
  히브리서: "히브리서", 야고보서: "야고보서",
  베드로전서: "베드로전서", 베드로후서: "베드로후서",
  요한일서: "요한일서", 요한이서: "요한이서", 요한삼서: "요한삼서",
  유다서: "유다서", 요한계시록: "요한계시록",
  // 약어
  창: "창세기", 출: "출애굽기", 레: "레위기", 민: "민수기", 신: "신명기",
  수: "여호수아", 삿: "사사기", 룻: "룻기",
  삼상: "사무엘상", 삼하: "사무엘하", 왕상: "열왕기상", 왕하: "열왕기하",
  대상: "역대상", 대하: "역대하", 라: "에스라", 느: "느헤미야", 더: "에스더",
  욥: "욥기", 시: "시편", 잠: "잠언", 전: "전도서", 아: "아가",
  사: "이사야", 렘: "예레미야", 애: "예레미야애가",
  겔: "에스겔", 단: "다니엘",
  호: "호세아", 욜: "요엘", 암: "아모스", 옵: "오바댜", 욘: "요나",
  미: "미가", 나: "나훔", 합: "하박국", 습: "스바냐", 학: "학개",
  슥: "스가랴", 말: "말라기",
  마: "마태복음", 막: "마가복음", 눅: "누가복음", 요: "요한복음",
  행: "사도행전", 롬: "로마서",
  고전: "고린도전서", 고후: "고린도후서",
  갈: "갈라디아서", 엡: "에베소서", 빌: "빌립보서", 골: "골로새서",
  살전: "데살로니가전서", 살후: "데살로니가후서",
  딤전: "디모데전서", 딤후: "디모데후서", 딛: "디도서", 몬: "빌레몬서",
  히: "히브리서", 약: "야고보서",
  벧전: "베드로전서", 벧후: "베드로후서",
  요일: "요한일서", 요이: "요한이서", 요삼: "요한삼서",
  유: "유다서", 계: "요한계시록",
};

function resolveBook(name: string): string {
  const full = BOOK_MAP[name] || name;
  // DB에 NFD(macOS 파일명)로 저장되어 있어 맞춰줌
  return full.normalize("NFD");
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
  const normalized = title.replace(/편/g, "장");
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
      book = resolveBook(withSpace[1].trim());
      rest = withSpace[2];
    } else if (noSpace) {
      book = resolveBook(noSpace[1].trim());
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
      <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 md:py-12">
        <Link
          href="/"
          className="text-sm text-neutral-400 hover:text-neutral-600"
        >
          ← 홈
        </Link>
        <div className="mt-6 flex items-baseline gap-2">
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

  // 본문 가져오기
  let verses: { book: string; chapter: number; verse: number; heading: string | null; content: string }[] = [];

  if (reading) {
    const readings = parseTitle(reading.title);
    for (const r of readings) {
      const { data } = await supabase
        .from("bible_text")
        .select("book, chapter, verse, heading, content")
        .eq("book", r.book)
        .in("chapter", r.chapters)
        .eq("version", "개역개정")
        .order("chapter")
        .order("verse");
      verses.push(...(data || []));
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 md:py-12">
      <Link
        href="/"
        className="text-sm text-neutral-400 hover:text-neutral-600"
      >
        ← 홈
      </Link>

      <div className="mt-6 flex items-baseline gap-2">
        <h1 className="text-2xl font-bold text-navy md:text-3xl">
          365 성경읽기
        </h1>
        {allReadings && allReadings.length > 0 && (
          <ReadingPlanModal
            readings={allReadings.map((r) => ({ day: r.day, title: r.title ?? "" }))}
            currentDay={day}
          />
        )}
      </div>
      <div className="mt-2 h-1 w-12 rounded bg-blue" />

      <BiblePageContent
        day={day}
        dayDateIso={dayDate.toISOString()}
        reading={reading}
        verses={verses}
        serverToday={serverToday}
      />
    </div>
  );
}
