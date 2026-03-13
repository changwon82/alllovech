import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import DesktopMenu from "./DesktopMenu";
import MobileMenu from "./MobileMenu";
import TopNavUser from "./TopNavUser";

export default async function TopNav() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";

  // admin, spend-report 등에서는 숨김
  if (pathname.startsWith("/admin") || pathname.startsWith("/spend-report")) {
    return null;
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
          <Suspense fallback={<div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-100" />}>
            <TopNavUser />
          </Suspense>

          {/* 모바일 햄버거 */}
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
