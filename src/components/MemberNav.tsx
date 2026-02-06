"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MemberNavProps {
  email: string;
  name?: string;
  isAdmin?: boolean;
}

const memberLinks = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/community", label: "커뮤니티" },
  { href: "/groups", label: "소그룹" },
  { href: "/giving", label: "헌금" },
  { href: "/directory", label: "명부" },
];

export default function MemberNav({ email, name, isAdmin }: MemberNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const displayName = name || email;

  return (
    <nav className="sticky top-0 z-20 -mx-4 border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="flex items-center justify-between py-3">
        {/* 로고 */}
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          alllovech
        </Link>

        {/* 데스크탑 링크 */}
        <div className="hidden items-center gap-1 md:flex">
          {memberLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
              }`}
            >
              관리
            </Link>
          )}
        </div>

        {/* 데스크탑 유저 영역 */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/"
            className="text-sm text-neutral-400 transition-colors hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white"
          >
            홈으로
          </Link>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {displayName}
          </span>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="rounded-full border border-neutral-300 px-3 py-1 text-sm font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              로그아웃
            </button>
          </form>
        </div>

        {/* 모바일 햄버거 */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 md:hidden dark:hover:bg-neutral-800"
          aria-label="메뉴 열기"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {open && (
        <div className="border-t border-neutral-100 pb-4 md:hidden dark:border-neutral-800">
          <div className="flex flex-col gap-1 pt-2">
            {memberLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                      : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
                }`}
              >
                관리
              </Link>
            )}
          </div>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="mx-3 mt-2 block rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-50 dark:text-neutral-500 dark:hover:bg-neutral-800/50"
          >
            ← 홈(랜딩페이지)으로
          </Link>
          <div className="mt-1 flex items-center justify-between border-t border-neutral-100 px-3 pt-3 dark:border-neutral-800">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {displayName}
            </span>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="rounded-full border border-neutral-300 px-3 py-1 text-sm font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
