import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/notifications";
import UserMenu from "./UserMenu";
import DesktopMenu from "./DesktopMenu";
import MobileMenu from "./MobileMenu";


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
          <Image src="/logo.png" alt="다애교회" width={40} height={40} />
          <span className="text-[19px] font-bold tracking-wide text-navy">다애교회</span>
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

