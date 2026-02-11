import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import YouTubePlayer from "./YouTubePlayer";
import TextSizeControl from "./TextSizeControl";

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

function parseTitle(title: string) {
  // 쉼표로 구분된 제목은 첫 번째 구간만 파싱
  const firstSection = title.split(",")[0].trim();
  const normalized = firstSection.replace(/편/g, "장");

  // "Book N-M장" or "Book N-M" (가장 일반적인 장 범위)
  const chapterRange = normalized.match(/^(.+?)\s+(\d+)-(\d+)/);
  if (chapterRange && +chapterRange[3] > +chapterRange[2]) {
    return { book: resolveBook(chapterRange[1].trim()), startCh: +chapterRange[2], endCh: +chapterRange[3] };
  }

  // "Book N:V-M:V" or "Book N:V-M장" (장을 넘나드는 절 범위)
  const crossChVerse = normalized.match(/^(.+?)\s+(\d+):\d+\s*-\s*(\d+)/);
  if (crossChVerse && +crossChVerse[3] > +crossChVerse[2]) {
    return { book: resolveBook(crossChVerse[1].trim()), startCh: +crossChVerse[2], endCh: +crossChVerse[3] };
  }

  // "BookN-M" (띄어쓰기 없음, 예: "요1-2:12")
  const noSpaceRange = normalized.match(/^([가-힣]+)(\d+)\s*-\s*(\d+)/);
  if (noSpaceRange && +noSpaceRange[3] >= +noSpaceRange[2]) {
    return { book: resolveBook(noSpaceRange[1].trim()), startCh: +noSpaceRange[2], endCh: +noSpaceRange[3] };
  }

  // "Book N장" (단일 장)
  const oneChapter = normalized.match(/^(.+?)\s+(\d+)장/);
  if (oneChapter) {
    return { book: resolveBook(oneChapter[1].trim()), startCh: +oneChapter[2], endCh: +oneChapter[2] };
  }

  // "Book N:V..." (절 참조에서 장 추출)
  const verseRef = normalized.match(/^(.+?)\s+(\d+):\d+/);
  if (verseRef) {
    return { book: resolveBook(verseRef[1].trim()), startCh: +verseRef[2], endCh: +verseRef[2] };
  }

  // "BookN..." (띄어쓰기 없는 참조, 예: "행20:2b")
  const noSpaceRef = normalized.match(/^([가-힣]+)(\d+)/);
  if (noSpaceRef) {
    return { book: resolveBook(noSpaceRef[1].trim()), startCh: +noSpaceRef[2], endCh: +noSpaceRef[2] };
  }

  // "Book N" (장 표시 없는 숫자)
  const bare = normalized.match(/^(.+?)\s+(\d+)$/);
  if (bare) {
    return { book: resolveBook(bare[1].trim()), startCh: +bare[2], endCh: +bare[2] };
  }

  return null;
}

export default async function BiblePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const today = getDayOfYear();
  const day = params.day ? Math.max(1, Math.min(365, parseInt(params.day))) : today;
  const isToday = day === today;

  // 읽기표
  const { data: reading } = await supabase
    .from("bible_readings")
    .select("day, title, youtube_id")
    .eq("day", day)
    .single();

  // 본문 가져오기
  let verses: { book: string; chapter: number; verse: number; heading: string | null; content: string }[] = [];

  if (reading) {
    const parsed = parseTitle(reading.title);
    if (parsed) {
      if ("endBook" in parsed && parsed.endBook) {
        const { data: v1 } = await supabase
          .from("bible_text")
          .select("book, chapter, verse, heading, content")
          .eq("book", parsed.book)
          .gte("chapter", parsed.startCh)
          .eq("version", "개역개정")
          .order("chapter")
          .order("verse");

        const { data: v2 } = await supabase
          .from("bible_text")
          .select("book, chapter, verse, heading, content")
          .eq("book", parsed.endBook)
          .lte("chapter", parsed.endCh)
          .eq("version", "개역개정")
          .order("chapter")
          .order("verse");

        verses = [...(v1 || []), ...(v2 || [])];
      } else {
        const { data: v } = await supabase
          .from("bible_text")
          .select("book, chapter, verse, heading, content")
          .eq("book", parsed.book)
          .gte("chapter", parsed.startCh)
          .lte("chapter", parsed.endCh)
          .eq("version", "개역개정")
          .order("chapter")
          .order("verse");

        verses = v || [];
      }
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

      <h1 className="mt-6 text-2xl font-bold text-navy md:text-3xl">
        365 성경읽기
      </h1>
      <div className="mt-2 h-1 w-12 rounded bg-blue" />

      {/* 날짜 네비게이션 */}
      <div className="mt-8 flex items-center justify-between">
        {day > 1 ? (
          <Link
            href={`/365bible?day=${day - 1}`}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            ← {day - 1}일차
          </Link>
        ) : (
          <div />
        )}

        {!isToday && (
          <Link
            href="/365bible"
            className="rounded-lg bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-navy/90"
          >
            오늘로
          </Link>
        )}

        {day < 365 ? (
          <Link
            href={`/365bible?day=${day + 1}`}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            {day + 1}일차 →
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* 읽기 정보 */}
      {reading ? (
        <section className={`mt-4 rounded-2xl border p-5 md:p-6 ${
          isToday
            ? "border-blue/20 bg-blue/5"
            : "border-neutral-200 bg-neutral-50"
        }`}>
          <p className={`text-sm font-medium ${isToday ? "text-blue" : "text-neutral-500"}`}>
            {day}일차{isToday && " (오늘)"} · {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} ({new Date().toLocaleDateString("ko-KR", { weekday: "short" })})
          </p>
          <p className="mt-1 text-xl font-bold text-neutral-800">
            {reading.title}
          </p>
        </section>
      ) : (
        <section className="mt-4 rounded-2xl border border-neutral-200 p-6 text-center text-neutral-500">
          읽기표를 불러올 수 없습니다
        </section>
      )}

      {/* 유튜브 영상 */}
      {reading?.youtube_id && (
        <section className="mt-6">
          <YouTubePlayer videoId={reading.youtube_id} />
        </section>
      )}

      {/* 성경 본문 */}
      {verses.length > 0 && (
        <section className="mt-8">
          <TextSizeControl>
            {verses.map((v, i) => {
              const showChapterHeader =
                i === 0 || verses[i - 1].chapter !== v.chapter || verses[i - 1].book !== v.book;

              return (
                <div key={`${v.book}-${v.chapter}-${v.verse}`}>
                  {showChapterHeader && (
                    <h2 className={`${i === 0 ? "mt-0" : "mt-10"} mb-4 border-b border-neutral-200 pb-2 text-lg font-bold text-navy`}>
                      {v.book.normalize("NFC")} {v.chapter}장
                    </h2>
                  )}
                  {v.heading && (
                    <p className="mt-5 mb-2 font-bold text-blue">
                      {v.heading}
                    </p>
                  )}
                  <p className="flex text-neutral-700">
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
    </div>
  );
}
