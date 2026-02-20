"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Toast = {
  id: string;
  message: string;
  href: string | null;
};

export default function NotificationToast({ userId }: { userId: string }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const supabase = useMemo(() => createClient(), []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const channel = supabase.channel(`user-notifications-${userId}`);

    channel
      .on("broadcast", { event: "notification" }, ({ payload }) => {
        const toast: Toast = {
          id: crypto.randomUUID(),
          message: payload.message ?? "새 알림이 있습니다",
          href: payload.href ?? null,
        };
        setToasts((prev) => [...prev, toast]);

        // 5초 후 자동 닫기
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-top rounded-xl border border-blue/20 bg-white p-4 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-neutral-800">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-neutral-400 hover:text-neutral-600"
            >
              &times;
            </button>
          </div>
          {toast.href && (
            <a
              href={toast.href}
              onClick={() => dismiss(toast.id)}
              className="mt-2 inline-block text-xs font-medium text-blue hover:underline"
            >
              확인하기 &rarr;
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
