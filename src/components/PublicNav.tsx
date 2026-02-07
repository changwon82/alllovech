"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { PublicMenuTreeItem } from "@/src/types/database";

const DEFAULT_MENUS: PublicMenuTreeItem[] = [
  {
    label: "환영합니다",
    href: "/welcome",
    description: "다애교회에 처음 오신 분들을 위한 안내입니다.",
    groups: [
      {
        title: "새가족 안내",
        items: [
          { label: "환영 인사", href: "/welcome" },
          { label: "새가족 등록", href: "/welcome/register" },
          { label: "새가족 교육", href: "/welcome/education" },
        ],
      },
      {
        title: "방문 안내",
        items: [
          { label: "오시는 길", href: "/welcome/directions" },
          { label: "예배 안내", href: "/welcome/services" },
          { label: "자주 묻는 질문", href: "/welcome/faq" },
        ],
      },
    ],
  },
  {
    label: "소개합니다",
    href: "/about",
    description: "다애교회의 역사와 비전, 섬기는 사람들을 소개합니다.",
    groups: [
      {
        title: "교회 소개",
        items: [
          { label: "담임목사 인사말", href: "/about" },
          { label: "교회 비전", href: "/about/vision" },
          { label: "교회 연혁", href: "/about/history" },
        ],
      },
      {
        title: "섬기는 사람들",
        items: [
          { label: "담당목사", href: "/about/pastors" },
          { label: "장로/권사", href: "/about/elders" },
          { label: "교역자", href: "/about/staff" },
        ],
      },
      {
        title: "교회 시설",
        items: [
          { label: "시설 안내", href: "/about/facilities" },
          { label: "약도/주차", href: "/welcome/directions" },
        ],
      },
    ],
  },
  {
    label: "예배와 말씀",
    href: "/worship",
    description: "다애교회의 예배와 말씀을 안내합니다.",
    groups: [
      {
        title: "예배 안내",
        items: [
          { label: "주일 예배", href: "/worship" },
          { label: "수요 예배", href: "/worship/wednesday" },
          { label: "금요 기도회", href: "/worship/friday" },
          { label: "새벽 기도회", href: "/worship/dawn" },
        ],
      },
      {
        title: "설교",
        items: [
          { label: "주일 설교", href: "/worship/sermons" },
          { label: "특별 집회", href: "/worship/special" },
        ],
      },
    ],
  },
  {
    label: "공동체와 양육",
    href: "/community-info",
    description: "함께 성장하는 다애교회의 공동체와 양육 프로그램입니다.",
    groups: [
      {
        title: "공동체",
        items: [
          { label: "청년부", href: "/community-info/young-adults" },
          { label: "청소년부", href: "/community-info/youth" },
          { label: "유초등부", href: "/community-info/children" },
          { label: "영유아부", href: "/community-info/nursery" },
        ],
      },
      {
        title: "소모임",
        items: [
          { label: "셀 모임", href: "/community-info/cell" },
          { label: "성경공부", href: "/community-info/bible-study" },
          { label: "기도 모임", href: "/community-info/prayer" },
        ],
      },
      {
        title: "양육 체계",
        items: [
          { label: "양육 프로그램", href: "/community-info/nurture" },
          { label: "제자 훈련", href: "/community-info/discipleship" },
        ],
      },
    ],
  },
  {
    label: "선교와 사역",
    href: "/mission",
    description: "다애교회의 선교 활동과 다양한 사역을 소개합니다.",
    groups: [
      {
        title: "선교",
        items: [
          { label: "선교 비전", href: "/mission" },
          { label: "해외 선교", href: "/mission/overseas" },
          { label: "국내 선교", href: "/mission/domestic" },
        ],
      },
      {
        title: "사회 봉사",
        items: [
          { label: "봉사 활동", href: "/mission/volunteer" },
          { label: "구제 사역", href: "/mission/relief" },
        ],
      },
      {
        title: "행정",
        items: [
          { label: "헌금 안내", href: "/mission/offering" },
          { label: "행정부서 안내", href: "/mission/admin" },
        ],
      },
    ],
  },
];

interface PublicNavProps {
  /** DB에서 불러온 메뉴 (없거나 비어 있으면 기본 메뉴 사용) */
  initialMenus?: PublicMenuTreeItem[] | null;
}

export default function PublicNav({ initialMenus }: PublicNavProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const menus = initialMenus && initialMenus.length > 0 ? initialMenus : DEFAULT_MENUS;

  return (
    <nav
      className="sticky top-0 z-30 -mx-4 border-b border-neutral-200 bg-white sm:-mx-6 lg:-mx-8 dark:border-neutral-800 dark:bg-neutral-950"
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 로고 → 공개 인덱스(웰컴) */}
        <Link href="/welcome" className="flex items-center gap-3 py-3">
          <Image src="/logo.png" alt="다애교회" width={48} height={48} />
          <div className="leading-tight">
            <span className="text-base font-bold tracking-tight text-neutral-800 dark:text-neutral-100 sm:text-lg">
              All Love Church
            </span>
            <span className="block text-xs text-neutral-400 dark:text-neutral-500">
              다애교회
            </span>
          </div>
        </Link>

        {/* 데스크탑 메뉴 */}
        <div className="hidden items-center lg:flex">
          {menus.map((menu) => (
            <div
              key={menu.label}
              className="relative"
              onMouseEnter={() => setOpenMenu(menu.label)}
            >
              <Link
                href={menu.href}
                className="block px-4 py-5 text-base font-bold text-neutral-600 transition-colors hover:text-neutral-900 sm:text-lg dark:text-neutral-400 dark:hover:text-white"
              >
                {menu.label}
              </Link>
            </div>
          ))}
          <Link
            href="/login"
            className="ml-4 rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            교인 로그인
          </Link>
        </div>

        {/* 모바일 햄버거 */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-center rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800"
          aria-label="메뉴"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 데스크탑 메가메뉴 드롭다운 */}
      {openMenu && (
        <div
          className="absolute left-0 right-0 hidden border-b border-neutral-200 bg-white shadow-lg lg:block dark:border-neutral-800 dark:bg-neutral-950"
          onMouseEnter={() => setOpenMenu(openMenu)}
          onMouseLeave={() => setOpenMenu(null)}
        >
          {menus
            .filter((m) => m.label === openMenu)
            .map((menu) => (
              <div key={menu.label} className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
                {/* 좌측 설명 */}
                <div className="w-56 shrink-0">
                  <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 sm:text-2xl">
                    {menu.label}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {menu.description}
                  </p>
                </div>

                {/* 소메뉴 그룹들 */}
                <div className="flex flex-1 gap-10">
                  {menu.groups.map((group) => (
                    <div key={group.title}>
                      <h4 className="mb-3 text-base font-bold text-neutral-800 dark:text-neutral-200">
                        {group.title}
                      </h4>
                      <ul className="space-y-2">
                        {group.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setOpenMenu(null)}
                              className="text-base text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="border-t border-neutral-100 bg-white pb-4 lg:hidden dark:border-neutral-800 dark:bg-neutral-950">
          {menus.map((menu) => (
            <div key={menu.label}>
              <button
                type="button"
                onClick={() =>
                  setMobileExpanded(mobileExpanded === menu.label ? null : menu.label)
                }
                className="flex w-full items-center justify-between px-4 py-3 text-base font-bold text-neutral-700 dark:text-neutral-300"
              >
                {menu.label}
                <svg
                  className={`h-4 w-4 transition-transform ${mobileExpanded === menu.label ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileExpanded === menu.label && (
                <div className="bg-neutral-50 px-4 py-3 dark:bg-neutral-900">
                  {menu.groups.map((group) => (
                    <div key={group.title} className="mb-3 last:mb-0">
                      <p className="mb-1.5 text-sm font-bold text-neutral-400 dark:text-neutral-500">
                        {group.title}
                      </p>
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setMobileOpen(false);
                            setMobileExpanded(null);
                          }}
                          className="block py-2 text-base text-neutral-600 dark:text-neutral-400"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mx-4 mt-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg bg-neutral-900 py-2.5 text-center text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              교인 로그인
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
