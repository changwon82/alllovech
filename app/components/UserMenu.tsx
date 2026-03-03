"use client";

import { createClient } from "@/lib/supabase/client";

export default function UserMenu({ name }: { name: string; canViewGroups?: boolean }) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
      <span>{name}</span>
      <span className="text-neutral-300">·</span>
      <button onClick={handleLogout} className="text-neutral-400 hover:text-red-500">
        로그아웃
      </button>
    </div>
  );
}
