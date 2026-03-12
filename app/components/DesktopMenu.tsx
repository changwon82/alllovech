"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface SubItem {
  label: string;
  href: string;
  desc?: string;
}

interface MenuItem {
  label: string;
  href: string;
  children: SubItem[];
}

const MENUS: MenuItem[] = [
  {
    label: "교회소개",
    href: "/about",
    children: [
      { label: "인사말씀", href: "/about" },
      { label: "설립목사", href: "/about/founder" },
      { label: "교회연혁", href: "/about/history" },
      { label: "섬기는 사람들", href: "/about/staff" },
      { label: "오시는 길", href: "/about/location" },
    ],
  },
  {
    label: "예배와 말씀",
    href: "/worship",
    children: [
      { label: "예배영상", href: "/sermon", desc: "설교 영상 모아보기" },
      { label: "예배안내", href: "/worship", desc: "예배 시간과 장소 안내" },
    ],
  },
  {
    label: "양육",
    href: "/nurture",
    children: [
      { label: "365 성경읽기", href: "/365bible", desc: "매일 성경을 함께 읽어요" },
      { label: "함께읽기 그룹", href: "/365bible/groups", desc: "그룹과 함께 성경읽기" },
    ],
  },
  {
    label: "다코방",
    href: "/dacobang",
    children: [
      { label: "교우소식", href: "/brothers", desc: "교우들의 기쁜 소식" },
      { label: "다애사진", href: "/gallery", desc: "다애교회를 사진으로 만나보세요" },
      { label: "교회소식", href: "/news", desc: "교회의 새로운 소식" },
    ],
  },
  {
    label: "봉사와 선교",
    href: "/service",
    children: [],
  },
  {
    label: "교제와 소식",
    href: "/fellowship",
    children: [
      { label: "교제와 소식", href: "/fellowship", desc: "교제와 소식" },
    ],
  },
];

export default function DesktopMenu() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenIdx(null);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div ref={menuRef} className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex lg:gap-8">
      {MENUS.map((menu, i) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className={`flex shrink-0 whitespace-nowrap items-center gap-1 text-[14px] font-bold transition ${
              openIdx === i ? "text-navy" : "text-neutral-700 hover:text-navy"
            }`}
          >
            {menu.label}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className={`h-3.5 w-3.5 transition-transform ${openIdx === i ? "rotate-180" : ""}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      ))}

      {/* 메가메뉴 드롭다운 */}
      {openIdx !== null && (
        <div className="absolute left-1/2 top-full z-50 mt-4 w-[700px] -translate-x-1/2">
          <div className="rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
            {/* 제목 */}
            <div className="border-b border-neutral-100 px-8 py-5">
              <h3 className="text-lg font-bold text-navy">{MENUS[openIdx].label}</h3>
            </div>

            {/* 하위 메뉴 */}
            {MENUS[openIdx].label === "봉사와 선교" ? (
              <div className="grid grid-cols-[1fr_1px_1fr] gap-x-6 p-6">
                {/* 봉사 */}
                <div>
                  <h4 className="mb-3 text-[13px] font-bold text-navy">봉사</h4>
                  <div className="space-y-1">
                    {[
                      { label: "중보기도", href: "/service/prayer" },
                      { label: "다애다문화학교", href: "/service/multicultural" },
                      { label: "에즈마이야", href: "/service/azmaya" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenIdx(null)}
                        className="block rounded-lg px-3 py-2 text-[14px] text-neutral-600 transition hover:bg-neutral-50 hover:text-navy"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 구분선 */}
                <div className="bg-neutral-100" />

                {/* 선교 */}
                <div>
                  <h4 className="mb-3 text-[13px] font-bold text-navy">선교</h4>
                  <div className="space-y-1">
                    {[
                      { label: "숨바선교", href: "/mission/sumba" },
                      { label: "국내선교", href: "/mission/domestic" },
                      { label: "해외선교", href: "/mission/overseas" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenIdx(null)}
                        className="block rounded-lg px-3 py-2 text-[14px] text-neutral-600 transition hover:bg-neutral-50 hover:text-navy"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : MENUS[openIdx].label === "예배와 말씀" ? (
              <div className="p-4">
                {/* 1행: 예배영상 */}
                <div className="grid grid-cols-2 gap-4 px-4 py-3">
                  <div className="flex items-center gap-4">
                    <Link
                      href="/sermon"
                      onClick={() => setOpenIdx(null)}
                      className="group flex items-center gap-3 rounded-xl transition hover:opacity-80"
                    >
                      <svg className="h-5 w-5 shrink-0 text-neutral-400 group-hover:text-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      <span className="text-[15px] font-semibold text-neutral-800 group-hover:text-navy">예배영상</span>
                    </Link>
                    <a
                      href="https://www.youtube.com/@alllovechurch"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-100"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      유튜브 채널
                    </a>
                  </div>
                  <Link
                    href="/365bible"
                    onClick={() => setOpenIdx(null)}
                    className="group flex items-center gap-3 rounded-xl transition hover:opacity-80"
                  >
                    <svg className="h-5 w-5 shrink-0 text-neutral-400 group-hover:text-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                    <span className="text-[15px] font-semibold text-neutral-800 group-hover:text-navy">365 성경읽기</span>
                  </Link>
                </div>

                <div className="my-2 h-px bg-neutral-100" />

                {/* 2행: 예배안내 = 2열 (예배시간 | 교육부서) */}
                <div className="px-4 pt-2">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-neutral-800">예배안내</span>
                    <Link
                      href="/worship"
                      onClick={() => setOpenIdx(null)}
                      className="text-[12px] text-neutral-400 transition hover:text-navy"
                    >
                      자세히 보기
                      <svg className="inline h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </Link>
                  </div>

                  <div className="grid grid-cols-[1fr_1px_1fr] gap-x-5">
                    {/* 왼쪽: 주일예배 등 */}
                    <div className="space-y-1.5 text-[12.5px]">
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-600">주일예배</span>
                        <span className="text-neutral-400">오전 9시 · 11시 · 오후 2시</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-600">수요오전예배</span>
                        <span className="text-neutral-400">오전 10시 30분</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-600">금요기도회</span>
                        <span className="text-neutral-400">저녁 8시 30분</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-600">새벽기도회</span>
                        <span className="text-right text-neutral-400">화–토 오전 6시<br />매월 첫 주 토 오전 7시</span>
                      </div>
                    </div>

                    {/* 구분선 */}
                    <div className="bg-neutral-100" />

                    {/* 오른쪽: 교육부서 */}
                    <div className="space-y-1.5 text-[12.5px]">
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-600">유아유치부</span>
                        <span className="text-neutral-400">주일 오전 11시</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-600">유초등부</span>
                        <span className="text-neutral-400">주일 오전 11시</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-600">청소년부</span>
                        <span className="text-neutral-400">주일 오전 11시</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-600">청년부</span>
                        <span className="text-neutral-400">주일 오후 1시</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 p-4">
                {MENUS[openIdx].children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setOpenIdx(null)}
                    className="group rounded-xl px-5 py-4 transition hover:bg-neutral-50"
                  >
                    <span className="text-[15px] font-semibold text-neutral-800 group-hover:text-navy">
                      {child.label}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
