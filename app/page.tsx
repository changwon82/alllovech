import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";

export default async function GatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-50 dark:from-neutral-900 dark:to-neutral-950">
      {/* 헤더: 로고 + 교회명 */}
      <header className="flex flex-col items-center pt-6 pb-4">
        <Image
          src="/logo.png"
          alt="다애교회"
          width={48}
          height={48}
          className="mb-2"
          priority
        />
        <h1 className="text-lg font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
          다애교회
        </h1>
      </header>

      {/* 환영 배너 (자세히 보기 → 교회 홈페이지) */}
      <section className="px-4 pb-5">
        <Link
          href="/welcome"
          className="relative block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700"
        >
          <div className="flex min-h-[120px] items-center justify-between gap-4 bg-gradient-to-r from-sky-200 to-sky-100 px-5 py-6 dark:from-sky-900/50 dark:to-sky-800/50">
            <p className="text-base font-semibold leading-snug text-neutral-800 dark:text-neutral-100">
              다애교회에 오신 여러분을<br />환영합니다
            </p>
            <span className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white dark:bg-sky-600">
              자세히 보기
            </span>
          </div>
          <span className="absolute right-3 top-3 text-xs text-neutral-500 dark:text-neutral-400">
            1/1
          </span>
        </Link>
      </section>

      {/* 섹션 1: 작은 사각 아이콘 4개 */}
      <section className="px-4 pb-5">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "새가족", href: "/welcome/register", icon: "🌱" },
            { label: "주보", href: "/welcome/services", icon: "📄" },
            { label: "교회소식", href: "/about", icon: "📰" },
            { label: "말씀나눔", href: "/worship/sermons", icon: "📖" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center rounded-xl border border-neutral-200 bg-white py-4 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="mt-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 섹션 2: 처음 오신 분 — 홈페이지 바로가기 + 설교 듣기 (큰 버튼 2개) */}
      <section className="px-4 pb-5">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/welcome"
            className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-4 text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <span className="text-2xl">🏠</span>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">홈페이지 바로가기</span>
            </div>
            <span className="shrink-0 text-white">→</span>
          </Link>
          <Link
            href="/worship/sermons"
            className="flex items-center gap-3 rounded-xl bg-indigo-700 px-4 py-4 text-white shadow-sm transition hover:bg-indigo-600 dark:bg-indigo-800 dark:hover:bg-indigo-700"
          >
            <span className="text-2xl">✝️</span>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">설교 듣기</span>
            </div>
            <span className="shrink-0 text-white">→</span>
          </Link>
        </div>
      </section>

      {/* 섹션 3: 헌금 안내 + YouTube */}
      <section className="px-4 pb-5">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/mission/offering"
            className="flex items-center gap-3 rounded-xl bg-neutral-600 px-4 py-4 text-white shadow-sm transition hover:bg-neutral-700 dark:bg-neutral-600 dark:hover:bg-neutral-500"
          >
            <span className="text-2xl">❤️</span>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">헌금 안내</span>
            </div>
            <span className="shrink-0 text-white">→</span>
          </Link>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-white px-4 py-4 text-neutral-800 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-100 dark:ring-neutral-600 dark:hover:bg-neutral-700"
          >
            <span className="text-2xl">▶️</span>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">YouTube 바로가기</span>
            </div>
            <span className="shrink-0 text-neutral-600 dark:text-neutral-400">→</span>
          </a>
        </div>
      </section>

      {/* 섹션 4: 2×3 그리드 메뉴 */}
      <section className="px-4 pb-5">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "예배안내", href: "/worship" },
            { label: "교회학교", href: "/community-info/children" },
            { label: "교회소식", href: "/about" },
            { label: "갤러리", href: "/welcome" },
            { label: "강좌", href: "/welcome/education" },
            { label: "온라인교인센터", href: user ? "/dashboard" : "/login" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl border border-neutral-200 bg-white py-4 text-center text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 섹션 5: 동그란 메뉴 8개 (다애교회 성도 — 교인 전용 포함) */}
      <section className="px-4 pb-8">
        <p className="mb-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
          다애교회 성도
        </p>
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "교인 전용",
              href: user ? "/dashboard" : "/login",
              icon: "🔐",
              highlight: true,
            },
            { label: "결혼", href: "/welcome", icon: "💒", highlight: false },
            { label: "부고", href: "/welcome", icon: "🕯️", highlight: false },
            { label: "증명서신청", href: "/welcome", icon: "📋", highlight: false },
            { label: "기부금신청", href: "/mission/offering", icon: "💰", highlight: false },
            { label: "성경", href: "/worship/sermons", icon: "📖", highlight: false },
            { label: "찬송", href: "/worship", icon: "🎵", highlight: false },
            { label: "자료검색", href: "/welcome", icon: "🔍", highlight: false },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center ${
                item.highlight
                  ? "rounded-full ring-2 ring-blue-500 ring-offset-2 ring-offset-sky-100 dark:ring-offset-neutral-900"
                  : ""
              }`}
            >
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-2xl shadow-sm transition hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700 ${
                  item.highlight ? "border-blue-400 dark:border-blue-500" : ""
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`mt-2 text-center text-[10px] leading-tight ${
                  item.highlight
                    ? "font-semibold text-blue-600 dark:text-blue-400"
                    : "font-medium text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="mt-auto border-t border-neutral-200 bg-neutral-800 px-4 py-6 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mx-auto max-w-md text-center text-xs text-neutral-300 dark:text-neutral-400">
          <p>다애교회 · 대한예수교장로회(합신)</p>
          <p className="mt-2">&copy; {new Date().getFullYear()} All Love Church</p>
        </div>
      </footer>
    </div>
  );
}
