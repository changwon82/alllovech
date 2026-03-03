import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { getUnreadCount } from "@/lib/notifications";
import ReadingPlanModal from "./ReadingPlanModal";
import BiblePageContent from "./BiblePageContent";
import UserMenu from "@/app/components/UserMenu";
import BottomNav from "@/app/components/BottomNav";
import LoginButton from "./LoginButton";
import { BOOK_FULL_TO_CODE } from "./plan";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

function clampDay(n: number): number {
  return Math.max(1, Math.min(365, n));
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { day?: string | string[] };
}) {
  const raw = Array.isArray(searchParams?.day) ? searchParams.day[0] : searchParams?.day;
  const day = raw ? clampDay(parseInt(raw)) : clampDay(getKoreaDayOfYear());

  const reading = await getCachedReadingByDay(day);
  const ogDescription = reading?.title ?? "365 성경읽기";
  const ogUrl = `${siteUrl}/365bible${raw ? `?day=${day}` : ""}`;

  const ogImage = reading?.youtube_id
    ? await getCachedYoutubeThumbnail(reading.youtube_id)
    : null;

  return {
    title: "365 성경읽기 | 다애교회",
    openGraph: {
      title: "365 성경읽기 | 다애교회",
      description: ogDescription,
      url: ogUrl,
      ...(ogImage ? { images: [{ ...ogImage, alt: ogDescription }] } : {}),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "365 성경읽기 | 다애교회",
      description: ogDescription,
      ...(ogImage ? { images: [ogImage.url] } : {}),
    },
  };
}

// Asia/Seoul 기준 연중 일차 계산 (서버사이드)
function getKoreaDayOfYear(): number {
  const seoulDateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  }); // "YYYY-MM-DD"
  const [year, month, day] = seoulDateStr.split("-").map(Number);
  const seoulDate = new Date(year, month - 1, day);
  const yearStart = new Date(year, 0, 0);
  return Math.floor((seoulDate.getTime() - yearStart.getTime()) / 86400000);
}

function getKoreaYear(): number {
  const seoulDateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
  return Number(seoulDateStr.split("-")[0]);
}

// ---------------------------------------------------------------------------
// 캐시된 DB 조회 함수 (모듈 레벨 정의)
// ---------------------------------------------------------------------------

function makeAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 365일 읽기표 전체 (제목 + 유튜브 ID) — 1시간 캐시
const getCachedAllReadings = unstable_cache(
  async () => {
    const client = makeAnonClient();
    const { data } = await client
      .from("bible_readings")
      .select("day, title, youtube_id")
      .order("day");
    return (data ?? []) as { day: number; title: string | null; youtube_id: string | null }[];
  },
  ["bible-readings-all"],
  { revalidate: 3600 }
);

// day 단건 조회 — 24시간 캐시, day별 캐시 키 분리
const getCachedReadingByDay = unstable_cache(
  async (day: number) => {
    const client = makeAnonClient();
    const { data, error } = await client
      .from("bible_readings")
      .select("day, title, youtube_id")
      .eq("day", day)
      .maybeSingle();
    if (error) return null;
    return data as { day: number; title: string | null; youtube_id: string | null } | null;
  },
  ["bible-reading-by-day"],
  { revalidate: 86400 }
);

// 유튜브 썸네일 URL 결정 — 24시간 캐시
// maxresdefault(1280×720) → sddefault(640×480) → hqdefault(480×360) 순으로 시도
// YouTube는 없는 사이즈 요청 시 120×90 플레이스홀더를 200 OK로 반환 → content-length 10KB 기준으로 구분
const getCachedYoutubeThumbnail = unstable_cache(
  async (youtubeId: string): Promise<{ url: string; width: number; height: number }> => {
    const candidates = [
      { url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`, width: 1280, height: 720 },
      { url: `https://img.youtube.com/vi/${youtubeId}/sddefault.jpg`,     width: 640,  height: 480 },
      { url: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,     width: 480,  height: 360 },
    ];
    for (const candidate of candidates) {
      try {
        const res = await fetch(candidate.url, { method: "HEAD" });
        const len = Number(res.headers.get("content-length") ?? 0);
        if (res.ok && len > 10_000) return candidate;
      } catch {}
    }
    return candidates[2]; // hqdefault는 항상 존재
  },
  ["youtube-thumbnail"],
  { revalidate: 86400 }
);

// 번역본 목록 — 1시간 캐시
const getCachedVersions = unstable_cache(
  async () => {
    const client = makeAnonClient();
    const { data } = await client
      .from("bible_versions")
      .select("id, code, name")
      .eq("is_active", true)
      .order("id");
    return (data ?? []) as { id: number; code: string; name: string }[];
  },
  ["bible-versions-v3"],
  { revalidate: 3600 }
);

// 성경 본문 (책코드 + 장 목록 + 번역본 ID) — 영구 캐시 (내용 불변)
const getCachedBibleText = unstable_cache(
  async (bookCode: string, sortedChapters: number[], versionId: number) => {
    const client = makeAnonClient();
    const { data } = await client
      .from("bible_text")
      .select("book, chapter, verse, heading, content")
      .eq("book_code", bookCode)
      .in("chapter", sortedChapters)
      .eq("version_id", versionId)
      .order("chapter")
      .order("verse");
    return (data ?? []) as {
      book: string;
      chapter: number;
      verse: number;
      heading: string | null;
      content: string;
    }[];
  },
  ["bible-text-v2"],
  { revalidate: false }
);

// 소제목만 조회 (NKRV 고정) — 영구 캐시
const getCachedBibleHeadings = unstable_cache(
  async (bookCode: string, sortedChapters: number[], nkrvId: number) => {
    const client = makeAnonClient();
    const { data } = await client
      .from("bible_text")
      .select("chapter, verse, heading")
      .eq("book_code", bookCode)
      .in("chapter", sortedChapters)
      .eq("version_id", nkrvId)
      .not("heading", "is", null)
      .order("chapter")
      .order("verse");
    return (data ?? []) as { chapter: number; verse: number; heading: string }[];
  },
  ["bible-headings"],
  { revalidate: false }
);

// ---------------------------------------------------------------------------
// 타입 정의
// ---------------------------------------------------------------------------

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
  compareContent?: string | null;
};
type DisplaySection = {
  book: string; chapter: number;
  startVerse?: number; endVerse?: number;
  showFullChapter: boolean;
  verses: DisplayVerse[];
};

// ---------------------------------------------------------------------------
// 파싱 헬퍼
// ---------------------------------------------------------------------------

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

  // 3. "N-M:V" (콜론이 오른쪽에만 → 시작 장부터 끝 장:절까지)
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

// ---------------------------------------------------------------------------
// 페이지 컴포넌트
// ---------------------------------------------------------------------------

export default async function BiblePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; version?: string; compare?: string; compareWith?: string }>;
}) {
  const params = await searchParams;

  const serverToday = Math.max(1, Math.min(365, getKoreaDayOfYear()));
  const day = params.day ? Math.max(1, Math.min(365, parseInt(params.day))) : serverToday;
  const koreaYear = getKoreaYear();
  const yearStart = new Date(koreaYear, 0, 1);
  const dayDate = new Date(yearStart.getTime() + (day - 1) * 86400000);

  // 인증 + 캐시 데이터를 동시에 조회
  const supabase = await createClient();
  const [{ data: { session } }, allReadings, versions] = await Promise.all([
    supabase.auth.getSession(),
    getCachedAllReadings(),
    getCachedVersions(),
  ]);
  const user = session?.user ?? null;

  let checkedDays: number[] = [];
  let userProfile: { name: string; status: string } | null = null;
  let isAdmin = false;
  let unreadCount = 0;

  let existingReflection: { id: string; content: string; visibility: "private" | "group" | "public"; created_at: string; updated_at: string } | null = null;

  if (user) {
    const [checksResult, profileResult, reflectionResult, roles, unread] = await Promise.all([
      supabase
        .from("bible_checks")
        .select("day")
        .eq("user_id", user.id)
        .eq("year", koreaYear),
      supabase
        .from("profiles")
        .select("name, status")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("reflections")
        .select("id, content, visibility, created_at, updated_at")
        .eq("user_id", user.id)
        .eq("day", day)
        .eq("year", koreaYear)
        .maybeSingle(),
      getUserRoles(supabase, user.id),
      getUnreadCount(supabase, user.id),
    ]);
    checkedDays = (checksResult.data ?? []).map((d: { day: number }) => d.day);
    userProfile = profileResult.data;
    existingReflection = reflectionResult.data;
    isAdmin = isAdminRole(roles);
    unreadCount = unread;
  }
  const reading = allReadings[day - 1] ?? null;

  // 번역본 결정 (URL param → 기본값 NKRV)
  const versionCode = params.version ?? "NKRV";
  const activeVersion = versions.find((v) => v.code === versionCode) ?? versions[0];
  const versionId = activeVersion?.id ?? 1;
  const nkrvId = versions.find((v) => v.code === "NKRV")?.id ?? 1;
  const needHeadings = versionId !== nkrvId;
  const compareMode = params.compare === "true";
  const compareVersion = compareMode
    ? (params.compareWith
        ? versions.find((v) => v.code === params.compareWith && v.code !== versionCode)
        : versions.find((v) => v.code !== versionCode)) ?? null
    : null;

  // 본문 가져오기 (캐시)
  let displaySections: DisplaySection[] = [];

  if (reading?.title) {
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

    // 책별 본문 조회 (캐시된 함수 — 병렬)
    const bookEntries = [...chaptersPerBook.entries()];
    const allVersesArr = await Promise.all(
      bookEntries.map(async ([book, chaptersSet]) => {
        const bookCode = BOOK_FULL_TO_CODE[book] ?? book;
        const sortedChapters = [...chaptersSet].sort((a, b) => a - b);
        const [verses, headings, compareVerses] = await Promise.all([
          getCachedBibleText(bookCode, sortedChapters, versionId),
          needHeadings
            ? getCachedBibleHeadings(bookCode, sortedChapters, nkrvId)
            : Promise.resolve([] as { chapter: number; verse: number; heading: string }[]),
          compareVersion
            ? getCachedBibleText(bookCode, sortedChapters, compareVersion.id)
            : Promise.resolve([] as { book: string; chapter: number; verse: number; heading: string | null; content: string }[]),
        ]);
        const headingMap = new Map(
          headings.map((h) => [`${h.chapter}:${h.verse}`, h.heading])
        );
        const compareMap = new Map(
          compareVerses.map((v) => [`${v.chapter}:${v.verse}`, v.content])
        );
        const merged = verses.map((v) => ({
          ...v,
          heading: needHeadings ? (headingMap.get(`${v.chapter}:${v.verse}`) ?? null) : v.heading,
          compareContent: compareVersion ? (compareMap.get(`${v.chapter}:${v.verse}`) ?? null) : undefined,
        }));
        return {
          book,
          byChapter: merged.reduce(
            (acc, v) => {
              if (!acc.has(v.chapter)) acc.set(v.chapter, []);
              acc.get(v.chapter)!.push(v);
              return acc;
            },
            new Map<number, typeof merged>()
          ),
        };
      })
    );

    const allVerses = new Map(allVersesArr.map((e) => [e.book, e.byChapter]));

    // DisplaySection[] 조립
    for (const section of sections) {
      for (const range of section.ranges) {
        const chapterVerses = allVerses.get(section.book)?.get(range.chapter) || [];
        const appearances = chapterCount.get(`${section.book}|${range.chapter}`) ?? 1;
        const hasRange = range.startVerse != null || range.endVerse != null;
        const isMulti = appearances > 1;

        if (!hasRange) {
          displaySections.push({
            book: section.book,
            chapter: range.chapter,
            showFullChapter: true,
            verses: chapterVerses.map((v) => ({ ...v, highlighted: true })),
          });
        } else if (isMulti) {
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
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20 md:pt-4 md:pb-24">
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-navy md:text-3xl">
            <a href="/365bible">365 성경읽기</a>
          </h1>
          {allReadings.length > 0 && (
            <ReadingPlanModal readings={allReadings} currentDay={day} versionCode={versionCode} compareMode={compareMode} compareWithCode={compareVersion?.code} />
          )}
        </div>
        {user ? (
          <UserMenu name={userProfile?.name ?? "이름 없음"} />
        ) : (
          <LoginButton />
        )}
      </div>
      <div className="mt-2 h-1 w-12 rounded-full bg-accent" />

      <BiblePageContent
        day={day}
        dayDateIso={dayDate.toISOString()}
        reading={reading}
        displayTitle={(reading?.title ?? "").normalize("NFC")}
        sections={displaySections}
        serverToday={serverToday}
        versions={versions}
        versionCode={versionCode}
        compareMode={compareMode}
        compareVersionCode={compareVersion?.code}
        compareVersionName={compareVersion?.name}
        user={user ? { id: user.id, name: userProfile?.name ?? "이름 없음", status: userProfile?.status ?? "pending" } : null}
        checkedDays={checkedDays}
        year={koreaYear}
        existingReflection={existingReflection}
      />

      {user && <BottomNav userId={user.id} isAdmin={isAdmin} unreadCount={unreadCount} />}
    </div>
  );
}
