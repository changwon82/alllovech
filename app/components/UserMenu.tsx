"use client";

import { useState, useEffect, useTransition } from "react";
import { useRealtimeUnreadCount } from "@/lib/useRealtimeUnreadCount";
import {
  isPushSupported,
  getNotificationPermission,
  subscribePush,
  unsubscribePush,
  getExistingSubscription,
} from "@/lib/pushSubscription";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/app/notifications/push-actions";
import NotificationModal from "./NotificationModal";
import { createClient } from "@/lib/supabase/client";

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

  // 푸시 알림 상태
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const ok = isPushSupported();
    setPushSupported(ok);
    if (ok) {
      getExistingSubscription().then((sub) => setPushOn(!!sub)).catch(() => {});
    }
  }, []);

  // 다른 컴포넌트에서 푸시 상태 변경 시 동기화
  useEffect(() => {
    function onPushChanged(e: Event) {
      setPushOn((e as CustomEvent<boolean>).detail);
    }
    window.addEventListener("push-changed", onPushChanged);
    return () => window.removeEventListener("push-changed", onPushChanged);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function handlePushToggle() {
    startTransition(async () => {
      try {
        if (pushOn) {
          const sub = await getExistingSubscription();
          if (sub) {
            await deletePushSubscription(sub.endpoint);
            await unsubscribePush();
          }
          setPushOn(false);
          window.dispatchEvent(new CustomEvent("push-changed", { detail: false }));
        } else {
          const sub = await subscribePush();
          if (sub) {
            const json = sub.toJSON();
            await savePushSubscription({
              endpoint: json.endpoint!,
              keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
            });
            setPushOn(true);
            window.dispatchEvent(new CustomEvent("push-changed", { detail: true }));
          }
        }
      } catch {
        // 무시
      }
    });
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
        {pushSupported && (
          <>
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-400">알림</span>
            <button
              onClick={handlePushToggle}
              disabled={isPending}
              className="relative h-4 w-7 rounded-full transition-colors disabled:opacity-50"
              style={{ backgroundColor: pushOn ? "#002c60" : "#d1d5db" }}
              aria-label={pushOn ? "푸시 알림 끄기" : "푸시 알림 켜기"}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${pushOn ? "left-[14px]" : "left-0.5"}`}
              />
            </button>
          </>
        )}
        <span className="text-neutral-300">·</span>
        <button
          onClick={handleLogout}
          className="text-neutral-400 hover:text-red-500"
          aria-label="로그아웃"
          title="로그아웃"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
      </div>

      <NotificationModal open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
