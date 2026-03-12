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
  let unreadCount = 0;
  if (user) {
    const [profileResult, count] = await Promise.all([
      supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
      getUnreadCount(supabase, user.id),
    ]);
    profileName = profileResult.data?.name ?? null;
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
            <UserMenu name={profileName ?? "마이페이지"} userId={user.id} unreadCount={unreadCount} />
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
        <div className="absolute right-0 top-0 h-full w-64 bg-[#2a2a2a] p-6 shadow-xl">
          <label htmlFor="mobile-menu-toggle" className="mb-6 flex justify-end text-white/50 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </label>
          <div className="flex flex-col gap-5">
            <MobileLink href="/">홈</MobileLink>
            <MobileLink href="/365bible">성경읽기</MobileLink>
            <MobileLink href="/worship">예배와 말씀</MobileLink>
            <MobileLink href="/365bible/groups">함께읽기</MobileLink>
            <MobileLink href="/jubo">주보</MobileLink>
            <MobileLink href="/gallery">다애사진</MobileLink>
            <MobileLink href="/news">교회소식</MobileLink>
            <MobileLink href="/my">나의기록</MobileLink>
            <MobileLink href="/notifications">알림</MobileLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[15px] font-medium text-white/70 transition hover:text-white">
      {children}
    </Link>
  );
}
