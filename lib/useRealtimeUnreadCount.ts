"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

// 실시간 알림 읽지 않은 수 추적
export function useRealtimeUnreadCount(userId: string | undefined, initialCount: number) {
  const [count, setCount] = useState(initialCount);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => setCount((prev) => prev + 1)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const wasRead = (payload.old as { is_read?: boolean }).is_read;
          const isRead = (payload.new as { is_read?: boolean }).is_read;
          if (!wasRead && isRead) setCount((prev) => Math.max(0, prev - 1));
          if (wasRead && !isRead) setCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return count;
}
