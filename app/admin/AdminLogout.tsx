"use client";

import { createClient } from "@/lib/supabase/client";

export default function AdminLogout() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-neutral-400 hover:text-red-500"
    >
      로그아웃
    </button>
  );
}
