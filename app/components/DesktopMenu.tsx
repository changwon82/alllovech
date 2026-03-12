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
      { label: "예배안내", href: "/worship", desc: "예배 시간과 장소 안내" },
      { label: "주일예배", href: "/sermon?cat=주일예배", desc: "주일예배 설교 영상" },
      { label: "수요오전예배", href: "/sermon?cat=수요오전예배", desc: "수요 오전 말씀" },
      { label: "금요기도회", href: "/sermon?cat=금요기도회", desc: "금요 기도회 말씀" },
      { label: "새벽기도회", href: "/sermon?cat=새벽기도회", desc: "새벽 기도회 말씀" },
      { label: "설교나눔 자료", href: "/sermon/workbook", desc: "설교 나눔 교재" },
      { label: "주보", href: "/jubo", desc: "매주 주보를 확인하세요" },
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
    children: [
      { label: "봉사안내", href: "/service", desc: "다양한 봉사에 참여하세요" },
    ],
  },
  {
    label: "선교",
    href: "/mission",
    children: [
      { label: "선교안내", href: "/mission", desc: "국내외 선교 활동" },
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
    <div ref={menuRef} className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
      {MENUS.map((menu, i) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className={`flex items-center gap-1 text-[15px] font-bold transition ${
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
          </div>
        </div>
      )}
    </div>
  );
}
