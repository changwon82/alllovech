"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function toggleSection(idx: number) {
    setOpenIdx(openIdx === idx ? null : idx);
  }

  function closeMenu() {
    setIsOpen(false);
    // openIdx는 유지 — 다시 열면 이전 상태 그대로
  }

  return (
    <div className="md:hidden">
      <button onClick={() => setIsOpen(true)} className="cursor-pointer text-neutral-400 transition hover:text-navy">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* 오버레이 */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeMenu}
      />

      {/* 패널 */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-72 overflow-y-auto bg-[#2a2a2a] shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="text-[15px] font-bold text-white">메뉴</span>
          <button onClick={closeMenu} className="text-white/50 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-2 py-3">
          <MobileLink href="/" onClick={closeMenu}>홈</MobileLink>

          <MobileSection title="교회소개" index={0} openIdx={openIdx} toggle={toggleSection}>
            <MobileSubLink href="/about" onClick={closeMenu}>인사말씀</MobileSubLink>
            <MobileSubLink href="/about/founder" onClick={closeMenu}>설립목사</MobileSubLink>
            <MobileSubLink href="/about/history" onClick={closeMenu}>교회연혁</MobileSubLink>
            <MobileSubLink href="/about/staff" onClick={closeMenu}>섬기는 사람들</MobileSubLink>
            <MobileSubLink href="/about/location" onClick={closeMenu}>오시는 길</MobileSubLink>
          </MobileSection>

          <MobileSection title="예배와 말씀" index={1} openIdx={openIdx} toggle={toggleSection}>
            <MobileSubLink href="/worship" onClick={closeMenu}>예배안내</MobileSubLink>
            <MobileSubLink href="/sermon" onClick={closeMenu}>예배영상</MobileSubLink>
            <MobileSubLink href="/365bible" onClick={closeMenu}>365 성경읽기</MobileSubLink>
          </MobileSection>

          <MobileSection title="양육" index={2} openIdx={openIdx} toggle={toggleSection}>
            <MobileSubLink href="/nurture/1" onClick={closeMenu}>양육메뉴_1</MobileSubLink>
            <MobileSubLink href="/nurture/2" onClick={closeMenu}>양육메뉴_2</MobileSubLink>
            <MobileSubLink href="/nurture/3" onClick={closeMenu}>양육메뉴_3</MobileSubLink>
            <MobileSubLink href="/nurture/4" onClick={closeMenu}>양육메뉴_4</MobileSubLink>
            <MobileSubLink href="/nurture/5" onClick={closeMenu}>양육메뉴_5</MobileSubLink>
            <MobileSubLink href="/nurture/6" onClick={closeMenu}>양육메뉴_6</MobileSubLink>
          </MobileSection>

          <MobileSection title="다코방" index={3} openIdx={openIdx} toggle={toggleSection}>
            <MobileSubLink href="/dacobang/1" onClick={closeMenu}>다코방_1</MobileSubLink>
            <MobileSubLink href="/dacobang/2" onClick={closeMenu}>다코방_2</MobileSubLink>
            <MobileSubLink href="/dacobang/3" onClick={closeMenu}>다코방_3</MobileSubLink>
            <MobileSubLink href="/dacobang/4" onClick={closeMenu}>다코방_4</MobileSubLink>
          </MobileSection>

          <MobileSection title="봉사와 선교" index={4} openIdx={openIdx} toggle={toggleSection}>
            <div className="mb-1 px-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-white/30">봉사</div>
            <MobileSubLink href="/service/prayer" onClick={closeMenu}>중보기도</MobileSubLink>
            <MobileSubLink href="/service/multicultural" onClick={closeMenu}>다애다문화학교</MobileSubLink>
            <MobileSubLink href="/service/ezemiah" onClick={closeMenu}>에즈마이야</MobileSubLink>
            <div className="mb-1 mt-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">선교</div>
            <MobileSubLink href="/mission/sumba" onClick={closeMenu}>숨바선교</MobileSubLink>
            <MobileSubLink href="/mission/domestic" onClick={closeMenu}>국내선교</MobileSubLink>
            <MobileSubLink href="/mission/overseas" onClick={closeMenu}>해외선교</MobileSubLink>
          </MobileSection>

          <MobileSection title="교제와 소식" index={5} openIdx={openIdx} toggle={toggleSection}>
            <MobileSubLink href="/news" onClick={closeMenu}>교회소식</MobileSubLink>
            <MobileSubLink href="/brothers" onClick={closeMenu}>교우소식</MobileSubLink>
            <MobileSubLink href="/jubo" onClick={closeMenu}>주보</MobileSubLink>
            <MobileSubLink href="/gallery" onClick={closeMenu}>다애사진</MobileSubLink>
          </MobileSection>

          <div className="my-2 mx-3 h-px bg-white/10" />

          <MobileSection title="교회재정" index={6} openIdx={openIdx} toggle={toggleSection}>
            <a href="https://alllovechurch.cafe24.com/bbs/board.php?bo_table=approval1" target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="block rounded-lg px-3 py-2 text-[13px] text-white/60 transition hover:bg-white/5 hover:text-white">재정청구</a>
            <a href="https://alllovechurch.cafe24.com/bbs/board.php?bo_table=approval_notice" target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="block rounded-lg px-3 py-2 text-[13px] text-white/60 transition hover:bg-white/5 hover:text-white">재정공지</a>
            <MobileSubLink href="/approval/donation" onClick={closeMenu}>기부금영수증</MobileSubLink>
          </MobileSection>
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
        <svg className={`h-4 w-4 text-white/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="pb-1 pl-2">
            {children}
          </div>
        </div>
      </div>
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
