import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/notifications";
import UserMenu from "./UserMenu";
import DesktopMenu from "./DesktopMenu";


export default async function TopNav() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";

  // admin, spend-report 등에서는 숨김
  if (pathname.startsWith("/admin") || pathname.startsWith("/spend-report")) {
    return null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileName: string | null = null;
  let avatarUrl: string | null = null;
  let unreadCount = 0;
  if (user) {
    const [profileResult, count] = await Promise.all([
      supabase.from("profiles").select("name, avatar_url").eq("id", user.id).maybeSingle(),
      getUnreadCount(supabase, user.id),
    ]);
    profileName = profileResult.data?.name ?? null;
    avatarUrl = profileResult.data?.avatar_url ?? null;
    unreadCount = count;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-8">
        {/* 좌측: 로고 */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo.png" alt="다애교회" width={34} height={34} />
          <span className="text-[16px] font-bold tracking-wide text-navy">다애교회</span>
        </Link>

        {/* 중앙: 메뉴 (데스크톱) */}
        <DesktopMenu />

        {/* 우측: 로그인/유저 */}
        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <UserMenu name={profileName ?? "마이페이지"} avatarUrl={avatarUrl} userId={user.id} unreadCount={unreadCount} />
          ) : (
            <>
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="flex items-center gap-1 text-[13px] font-medium text-neutral-500 transition hover:text-navy">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                로그인
              </Link>
              <Link href="/signup" className="flex items-center gap-1 text-[13px] font-medium text-neutral-500 transition hover:text-navy">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                회원가입
              </Link>
            </>
          )}

          {/* 모바일 햄버거 */}
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}

function MobileMenu() {
  return (
    <div className="md:hidden">
      <label htmlFor="mobile-menu-toggle" className="cursor-pointer text-neutral-400 transition hover:text-navy">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </label>
      <input type="checkbox" id="mobile-menu-toggle" className="peer hidden" />
      <div className="fixed inset-0 z-50 hidden peer-checked:block">
        {/* 배경 오버레이 */}
        <label htmlFor="mobile-menu-toggle" className="absolute inset-0 bg-black/50" />
        {/* 메뉴 패널 */}
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
            {/* 홈 */}
            <MobileLink href="/">홈</MobileLink>

            {/* 교회소개 */}
            <MobileSection title="교회소개">
              <MobileSubLink href="/about">인사말씀</MobileSubLink>
              <MobileSubLink href="/about/founder">설립목사</MobileSubLink>
              <MobileSubLink href="/about/history">교회연혁</MobileSubLink>
              <MobileSubLink href="/about/staff">섬기는 사람들</MobileSubLink>
              <MobileSubLink href="/about/location">오시는 길</MobileSubLink>
            </MobileSection>

            {/* 예배와 말씀 */}
            <MobileSection title="예배와 말씀">
              <MobileSubLink href="/sermon">예배영상</MobileSubLink>
              <MobileSubLink href="/worship">예배안내</MobileSubLink>
              <MobileSubLink href="/365bible">365 성경읽기</MobileSubLink>
            </MobileSection>

            {/* 양육 */}
            <MobileSection title="양육">
              <MobileSubLink href="/365bible">365 성경읽기</MobileSubLink>
              <MobileSubLink href="/365bible/groups">함께읽기 그룹</MobileSubLink>
            </MobileSection>

            {/* 다코방 */}
            <MobileSection title="다코방">
              <MobileSubLink href="/brothers">교우소식</MobileSubLink>
              <MobileSubLink href="/gallery">다애사진</MobileSubLink>
              <MobileSubLink href="/news">교회소식</MobileSubLink>
            </MobileSection>

            {/* 봉사와 선교 */}
            <MobileSection title="봉사와 선교">
              <div className="mb-1 px-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-white/30">봉사</div>
              <MobileSubLink href="/service/prayer">중보기도</MobileSubLink>
              <MobileSubLink href="/service/multicultural">다애다문화학교</MobileSubLink>
              <MobileSubLink href="/service/ezemiah">에즈마이야</MobileSubLink>
              <div className="mb-1 mt-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">선교</div>
              <MobileSubLink href="/mission/sumba">숨바선교</MobileSubLink>
              <MobileSubLink href="/mission/domestic">국내선교</MobileSubLink>
              <MobileSubLink href="/mission/overseas">해외선교</MobileSubLink>
            </MobileSection>

            {/* 교제와 소식 */}
            <MobileSection title="교제와 소식">
              <MobileSubLink href="/news">교회소식</MobileSubLink>
              <MobileSubLink href="/brothers">교우소식</MobileSubLink>
              <MobileSubLink href="/jubo">주보</MobileSubLink>
              <MobileSubLink href="/gallery">다애사진</MobileSubLink>
            </MobileSection>

            {/* 구분선 */}
            <div className="my-2 mx-3 h-px bg-white/10" />

            {/* 개인 메뉴 */}
            <MobileLink href="/365bible/my">나의기록</MobileLink>
            <MobileLink href="/notifications">알림</MobileLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-semibold text-white/80 transition hover:bg-white/5 hover:text-white [&::-webkit-details-marker]:hidden">
        {title}
        <svg className="h-4 w-4 text-white/40 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </summary>
      <div className="pb-1 pl-2">
        {children}
      </div>
    </details>
  );
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-white/80 transition hover:bg-white/5 hover:text-white">
      {children}
    </Link>
  );
}

function MobileSubLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded-lg px-3 py-2 text-[13px] text-white/60 transition hover:bg-white/5 hover:text-white">
      {children}
    </Link>
  );
}
