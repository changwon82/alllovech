"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// 실시간 알림 읽지 않은 수 추적
export function useRealtimeUnreadCount(userId: string | undefined, initialCount: number) {
  const [count, setCount] = useState(initialCount);
  const supabase = useMemo(() => createClient(), []);

  // 서버에서 전달된 초기값이 바뀌면 동기화
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  // DB에서 직접 카운트 조회
  const fetchCount = useCallback(async () => {
    if (!userId) return;
    const { count: c } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (c !== null) setCount(c);
  }, [userId, supabase]);

  useEffect(() => {
    if (!userId) return;

    // 탭 포커스 시 동기화
    function handleVisibility() {
      if (document.visibilityState === "visible") fetchCount();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    // 커스텀 이벤트 (문의 전송 등 앱 내 알림 생성 시)
    function handleNotificationChange() {
      fetchCount();
    }
    window.addEventListener("notification-change", handleNotificationChange);

    // 폴링 (30초마다)
    const interval = setInterval(fetchCount, 30_000);

    // Realtime 구독 (동작하면 bonus)
    const channel = supabase
      .channel(`unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("notification-change", handleNotificationChange);
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, fetchCount]);

  return count;
}
