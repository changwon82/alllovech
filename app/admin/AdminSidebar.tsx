"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type NavItem = { href: string; label: string; icon: string };

const topItems: NavItem[] = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/settings", label: "설정", icon: "⚙️" },
  { href: "/admin/users", label: "사용자", icon: "👤" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [contactCount, setContactCount] = useState(0);

  const fetchContactCount = useCallback(async () => {
    const supabase = createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "contact");
    setContactCount(count ?? 0);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed") === "true";
    if (saved) setCollapsed(true);
    setMounted(true);
    fetchContactCount();

    function handleChange() { fetchContactCount(); }
    window.addEventListener("contact-change", handleChange);
    return () => window.removeEventListener("contact-change", handleChange);
  }, [fetchContactCount]);

  useEffect(() => {
    if (mounted) localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed, mounted]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col bg-navy ${mounted ? "transition-all duration-200" : ""} ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-4">
        {!collapsed && (
          <div className="px-2">
            <h1 className="text-lg font-bold text-white">다애교회</h1>
            <p className="mt-0.5 text-xs text-white/50">관리자</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="rounded p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
          title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            {collapsed ? (
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            )}
          </svg>
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-0.5">
          {topItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-white/15 font-medium text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white/90"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0 text-base">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="my-3 border-t border-white/10" />

        {/* 카카오 공유 디버거 */}
        <a
          href="https://developers.kakao.com/tool/debugger/sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white/90"
          title={collapsed ? "공유 디버거" : undefined}
        >
          <span className="shrink-0 text-base">🔗</span>
          {!collapsed && (
            <span className="flex items-center gap-1">
              카카오톡 디버거
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-white/30">
                <path fillRule="evenodd" d="M4.22 11.78a.75.75 0 0 1 0-1.06L9.44 5.5H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V6.56l-5.22 5.22a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </a>

        <div className="my-3 border-t border-white/10" />

        {/* 교인명단 */}
        <Link
          href="/admin/members"
          className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            pathname.startsWith("/admin/members")
              ? "bg-white/15 font-medium text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white/90"
          }`}
          title={collapsed ? "교인명단" : undefined}
        >
          <span className="shrink-0 text-base">📋</span>
          {!collapsed && <span>교인명단</span>}
        </Link>

        {/* 다코방사역 */}
        <Link
          href="/admin/dakobang"
          className={`mt-0.5 flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            pathname.startsWith("/admin/dakobang")
              ? "bg-white/15 font-medium text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white/90"
          }`}
          title={collapsed ? "다코방사역" : undefined}
        >
          <span className="shrink-0 text-base">👥</span>
          {!collapsed && <span>다코방사역</span>}
        </Link>

        {/* 문의 관리 */}
        <Link
          href="/admin/contacts"
          className={`mt-0.5 flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            pathname.startsWith("/admin/contacts")
              ? "bg-white/15 font-medium text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white/90"
          }`}
          title={collapsed ? "문의 관리" : undefined}
        >
          <span className="relative shrink-0 text-base">
            💬
            {collapsed && contactCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">{contactCount}</span>
            )}
          </span>
          {!collapsed && (
            <span className="flex items-center gap-2">
              문의 관리
              {contactCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{contactCount}</span>
              )}
            </span>
          )}
        </Link>

        {/* 365 성경읽기 */}
        <div className="mt-0.5 flex items-center">
          <Link
            href="/admin/bible"
            className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              pathname.startsWith("/admin/bible")
                ? "bg-white/15 font-medium text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white/90"
            }`}
            title={collapsed ? "365 성경읽기" : undefined}
          >
            <span className="shrink-0 text-base">📖</span>
            {!collapsed && <span>365 성경읽기</span>}
          </Link>
          {!collapsed && (
            <Link
              href="/365bible"
              className="shrink-0 rounded p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
              title="365 성경읽기로 이동"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M4.22 11.78a.75.75 0 0 1 0-1.06L9.44 5.5H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V6.56l-5.22 5.22a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
        </div>
      </nav>

      {/* 하단 */}
      <div className="border-t border-white/10 px-2 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/40 transition-colors hover:bg-white/10 hover:text-red-300"
          title={collapsed ? "로그아웃" : undefined}
        >
          <span className="shrink-0 text-base">🚪</span>
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  );
}
