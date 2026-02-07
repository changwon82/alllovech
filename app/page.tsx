import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";

export default async function GatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#e8e0d4] px-4 dark:bg-[#2a2520]">

      {/* 환영 문구 */}
      <p className="mb-6 text-center text-sm leading-relaxed text-[#8a7e6e] sm:text-base dark:text-[#a89d8d]">
        &ldquo; 사랑 안에서 서로를 세우며<br />
        함께 성장하는 교회 &rdquo;
      </p>

      {/* 교회 로고 & 이름 */}
      <Image
        src="/logo.png"
        alt="All Love Church"
        width={100}
        height={100}
        className="mb-3"
        priority
      />
      <h1 className="mb-10 text-center text-2xl font-bold tracking-tight text-[#5a4f42] sm:text-3xl dark:text-[#d4c8b8]">
        All Love Church
      </h1>

      {/* 카드 2개 */}
      <div className="flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:gap-5">

        {/* 처음 오셨나요? */}
        <Link
          href="/about"
          className="group flex flex-1 flex-col items-center rounded-2xl bg-white px-6 py-10 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:py-12 dark:bg-neutral-900"
        >
          <span className="text-3xl">🤗</span>
          <h2 className="mt-4 text-lg font-bold text-neutral-800 dark:text-neutral-100">
            처음 오셨나요?
          </h2>
          <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
            교회 소개 · 오시는 길
          </p>
          <span className="mt-5 text-sm font-semibold text-amber-600 transition-colors group-hover:text-amber-700 dark:text-amber-400 dark:group-hover:text-amber-300">
            둘러보기 &rsaquo;
          </span>
        </Link>

        {/* 성도 로그인 */}
        <Link
          href={user ? "/dashboard" : "/login"}
          className="group flex flex-1 flex-col items-center rounded-2xl bg-white px-6 py-10 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:py-12 dark:bg-neutral-900"
        >
          <span className="text-3xl">🙏</span>
          <h2 className="mt-4 text-lg font-bold text-neutral-800 dark:text-neutral-100">
            우리 교회 성도입니다
          </h2>
          <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
            {user ? "교인 전용 페이지" : "로그인 · 교인 서비스"}
          </p>
          <span className="mt-5 text-sm font-semibold text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
            {user ? "입장하기" : "로그인"} &rsaquo;
          </span>
        </Link>

      </div>

      {/* 푸터 */}
      <p className="absolute bottom-5 text-xs text-[#b0a698] dark:text-[#5a5248]">
        &copy; {new Date().getFullYear()} All Love Church
      </p>
    </div>
  );
}
