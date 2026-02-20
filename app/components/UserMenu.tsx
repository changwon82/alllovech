"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu({ name, logoutOnly = false }: { name: string; logoutOnly?: boolean }) {
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
        className="text-xs text-neutral-500 hover:text-navy"
      >
        {name} ▾
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[100px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {!logoutOnly && (
            <>
              <a
                href="/my"
                className="block px-4 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                내 기록
              </a>
              <a
                href="/groups"
                className="block px-4 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                소그룹
              </a>
              <hr className="my-1 border-neutral-100" />
            </>
          )}
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
