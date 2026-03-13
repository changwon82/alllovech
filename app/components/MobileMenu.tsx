"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileMenu() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function toggle(idx: number) {
    setOpenIdx(openIdx === idx ? null : idx);
  }

  function closeMenu() {
    const el = document.getElementById("mobile-menu-toggle") as HTMLInputElement | null;
    if (el) el.checked = false;
    setOpenIdx(null);
  }

  return (
    <div className="md:hidden">
      <label htmlFor="mobile-menu-toggle" className="cursor-pointer text-neutral-400 transition hover:text-navy">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </label>
      <input type="checkbox" id="mobile-menu-toggle" className="peer hidden" />
      <div className="fixed inset-0 z-50 hidden peer-checked:block">
        <label htmlFor="mobile-menu-toggle" className="absolute inset-0 bg-black/50" />
        <div className="absolute right-0 top-0 h-full w-72 overflow-y-auto bg-[#2a2a2a] shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <span className="text-[15px] font-bold text-white">메뉴</span>
            <label htmlFor="mobile-menu-toggle" className="text-white/50 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </label>
          </div>

          <div className="px-2 py-3">
            <MobileLink href="/" onClick={closeMenu}>홈</MobileLink>

            <MobileSection title="교회소개" index={0} openIdx={openIdx} toggle={toggle}>
              <MobileSubLink href="/about" onClick={closeMenu}>인사말씀</MobileSubLink>
              <MobileSubLink href="/about/founder" onClick={closeMenu}>설립목사</MobileSubLink>
              <MobileSubLink href="/about/history" onClick={closeMenu}>교회연혁</MobileSubLink>
              <MobileSubLink href="/about/staff" onClick={closeMenu}>섬기는 사람들</MobileSubLink>
              <MobileSubLink href="/about/location" onClick={closeMenu}>오시는 길</MobileSubLink>
            </MobileSection>

            <MobileSection title="예배와 말씀" index={1} openIdx={openIdx} toggle={toggle}>
              <MobileSubLink href="/sermon" onClick={closeMenu}>예배영상</MobileSubLink>
              <MobileSubLink href="/worship" onClick={closeMenu}>예배안내</MobileSubLink>
              <MobileSubLink href="/365bible" onClick={closeMenu}>365 성경읽기</MobileSubLink>
            </MobileSection>

            <MobileSection title="양육" index={2} openIdx={openIdx} toggle={toggle}>
              <MobileSubLink href="/365bible" onClick={closeMenu}>365 성경읽기</MobileSubLink>
              <MobileSubLink href="/365bible/groups" onClick={closeMenu}>함께읽기 그룹</MobileSubLink>
            </MobileSection>

            <MobileSection title="다코방" index={3} openIdx={openIdx} toggle={toggle}>
              <MobileSubLink href="/brothers" onClick={closeMenu}>교우소식</MobileSubLink>
              <MobileSubLink href="/gallery" onClick={closeMenu}>다애사진</MobileSubLink>
              <MobileSubLink href="/news" onClick={closeMenu}>교회소식</MobileSubLink>
            </MobileSection>

            <MobileSection title="봉사와 선교" index={4} openIdx={openIdx} toggle={toggle}>
              <div className="mb-1 px-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-white/30">봉사</div>
              <MobileSubLink href="/service/prayer" onClick={closeMenu}>중보기도</MobileSubLink>
              <MobileSubLink href="/service/multicultural" onClick={closeMenu}>다애다문화학교</MobileSubLink>
              <MobileSubLink href="/service/ezemiah" onClick={closeMenu}>에즈마이야</MobileSubLink>
              <div className="mb-1 mt-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">선교</div>
              <MobileSubLink href="/mission/sumba" onClick={closeMenu}>숨바선교</MobileSubLink>
              <MobileSubLink href="/mission/domestic" onClick={closeMenu}>국내선교</MobileSubLink>
              <MobileSubLink href="/mission/overseas" onClick={closeMenu}>해외선교</MobileSubLink>
            </MobileSection>

            <MobileSection title="교제와 소식" index={5} openIdx={openIdx} toggle={toggle}>
              <MobileSubLink href="/news" onClick={closeMenu}>교회소식</MobileSubLink>
              <MobileSubLink href="/brothers" onClick={closeMenu}>교우소식</MobileSubLink>
              <MobileSubLink href="/jubo" onClick={closeMenu}>주보</MobileSubLink>
              <MobileSubLink href="/gallery" onClick={closeMenu}>다애사진</MobileSubLink>
            </MobileSection>

            <div className="my-2 mx-3 h-px bg-white/10" />

            <MobileSection title="교회재정" index={6} openIdx={openIdx} toggle={toggle}>
              <MobileSubLink href="/approval" onClick={closeMenu}>재정청구</MobileSubLink>
              <MobileSubLink href="/approval/notice" onClick={closeMenu}>재정공지</MobileSubLink>
              <MobileSubLink href="/approval/donation" onClick={closeMenu}>기부금영수증</MobileSubLink>
            </MobileSection>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileSection({
  title,
  index,
  openIdx,
  toggle,
  children,
}: {
  title: string;
  index: number;
  openIdx: number | null;
  toggle: (idx: number) => void;
  children: React.ReactNode;
}) {
  const isOpen = openIdx === index;
  return (
    <div>
      <button
        onClick={() => toggle(index)}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
      >
        {title}
        <svg className={`h-4 w-4 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {isOpen && (
        <div className="pb-1 pl-2">
          {children}
        </div>
      )}
    </div>
  );
}

function MobileLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-white/80 transition hover:bg-white/5 hover:text-white">
      {children}
    </Link>
  );
}

function MobileSubLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block rounded-lg px-3 py-2 text-[13px] text-white/60 transition hover:bg-white/5 hover:text-white">
      {children}
    </Link>
  );
}
