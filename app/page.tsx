import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";

export default async function GatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white px-4 dark:bg-neutral-950">

      {/* 환영 문구 */}
      <p className="mb-8 text-center text-lg leading-relaxed font-medium text-neutral-500 sm:text-xl dark:text-neutral-400">
        &ldquo; 사랑 안에서 서로를 세우며<br />
        함께 성장하는 교회 &rdquo;
      </p>

      {/* 교회 로고 & 이름 */}
      <Image
        src="/logo.png"
        alt="All Love Church"
        width={100}
        height={100}
        className="mb-4"
        priority
      />
      <h1 className="text-center text-2xl font-bold tracking-tight text-neutral-800 sm:text-3xl dark:text-neutral-100">
        All Love Church
      </h1>
      <p className="mb-10 mt-2 flex items-baseline justify-center gap-2">
        <span className="text-xl font-semibold tracking-widest text-neutral-500 dark:text-neutral-400">
          다애교회
        </span>
        <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500">
          대한예수교장로회(합신)
        </span>
      </p>

      {/* 카드 2개 */}
      <div className="flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:gap-5">

        {/* 처음 오셨나요? → 공개용 인덱스(처음 오신 분) */}
        <Link
          href="/welcome"
          className="group flex flex-1 flex-col items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-10 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg sm:py-12 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
        >
          <span className="text-3xl">🤗</span>
          <h2 className="mt-4 text-lg font-bold text-neutral-800 dark:text-neutral-100">
            처음 오셨나요?
          </h2>
          <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
            교회 소개 · 오시는 길
          </p>
          <span className="mt-5 text-sm font-semibold text-neutral-500 transition-colors group-hover:text-neutral-800 dark:text-neutral-400 dark:group-hover:text-neutral-200">
            둘러보기 &rsaquo;
          </span>
        </Link>

        {/* 성도 로그인 */}
        <Link
          href={user ? "/dashboard" : "/login"}
          className="group flex flex-1 flex-col items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-10 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg sm:py-12 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
        >
          <span className="text-3xl">🙏</span>
          <h2 className="mt-4 text-lg font-bold text-neutral-800 dark:text-neutral-100">
            다애교회 성도입니다
          </h2>
          <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
            {user ? "교인 전용 페이지" : "로그인 · 교인 서비스"}
          </p>
          <span className="mt-5 text-sm font-semibold text-neutral-500 transition-colors group-hover:text-neutral-800 dark:text-neutral-400 dark:group-hover:text-neutral-200">
            {user ? "입장하기" : "로그인"} &rsaquo;
          </span>
        </Link>

      </div>

      {/* 푸터 */}
      <p className="absolute bottom-5 text-xs text-neutral-300 dark:text-neutral-700">
        &copy; {new Date().getFullYear()} All Love Church
      </p>
    </div>
  );
}
