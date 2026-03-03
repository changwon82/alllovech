"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu({ name, canViewGroups = false, unreadCount = 0 }: { name: string; canViewGroups?: boolean; unreadCount?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-xs text-neutral-500 hover:text-navy"
      >
        {name} ▾
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[100px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          <a
            href="/my"
            className="block px-4 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
          >
            마이페이지
          </a>
          <a
            href="/notifications"
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
          >
            알림
            {unreadCount > 0 && (
              <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </a>
          {canViewGroups && (
            <a
              href="/groups"
              className="block px-4 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              함께읽기
            </a>
          )}
          <hr className="my-1 border-neutral-100" />
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-1.5 text-left text-xs text-red-500 hover:bg-neutral-50"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
