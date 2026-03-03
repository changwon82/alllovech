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

    // Realtime 구독 — 필터 없이 전체 이벤트 수신 (RLS가 자동 필터링)
    const channel = supabase
      .channel(`unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => fetchCount()
      )
      .subscribe();

    // 탭 포커스 시 동기화
    function handleVisibility() {
      if (document.visibilityState === "visible") fetchCount();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId, supabase, fetchCount]);

  return count;
}
