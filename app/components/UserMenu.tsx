"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeUnreadCount } from "@/lib/useRealtimeUnreadCount";
import NotificationModal from "./NotificationModal";

export default function UserMenu({
  name,
  userId,
  unreadCount = 0,
}: {
  name: string;
  canViewGroups?: boolean;
  userId?: string;
  unreadCount?: number;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const realtimeCount = useRealtimeUnreadCount(userId, unreadCount);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <span>{name}</span>
        {userId && (
          <>
            <span className="text-neutral-300">·</span>
            <button
              onClick={() => setNotifOpen(true)}
              className="relative text-neutral-400 hover:text-navy"
              aria-label="알림"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              {realtimeCount > 0 && (
                <span className="absolute -top-1.5 -right-2 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-medium text-white">
                  {realtimeCount > 99 ? "99+" : realtimeCount}
                </span>
              )}
            </button>
          </>
        )}
        <span className="text-neutral-300">·</span>
        <button onClick={handleLogout} className="text-neutral-400 hover:text-red-500">
          로그아웃
        </button>
      </div>

      <NotificationModal open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
