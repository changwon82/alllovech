"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeUnreadCount } from "@/lib/useRealtimeUnreadCount";
import {
  isPushSupported,
  subscribePush,
  unsubscribePush,
  getExistingSubscription,
} from "@/lib/pushSubscription";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/app/notifications/push-actions";
import NotificationModal from "./NotificationModal";
import Avatar from "./ui/Avatar";
import AvatarPicker from "@/app/365bible/my/AvatarPicker";
import { createClient } from "@/lib/supabase/client";
import DarkModeToggle from "./DarkModeToggle";

export default function UserMenu({
  name,
  avatarUrl: initialAvatarUrl,
  userId,
  unreadCount = 0,
}: {
  name: string;
  avatarUrl?: string | null;
  canViewGroups?: boolean;
  userId?: string;
  unreadCount?: number;
}) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? null);
  const realtimeCount = useRealtimeUnreadCount(userId, unreadCount);

  // 푸시 알림 상태
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pushTooltip, setPushTooltip] = useState(false);
  const pushRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ok = isPushSupported();
    setPushSupported(ok);
    if (ok) {
      getExistingSubscription().then((sub) => setPushOn(!!sub)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onPushChanged(e: Event) {
      setPushOn((e as CustomEvent<boolean>).detail);
    }
    window.addEventListener("push-changed", onPushChanged);
    return () => window.removeEventListener("push-changed", onPushChanged);
  }, []);

  // 푸시 툴팁 외부 클릭 닫기
  useEffect(() => {
    if (!pushTooltip) return;
    function handleClick(e: MouseEvent) {
      if (pushRef.current && !pushRef.current.contains(e.target as Node)) {
        setPushTooltip(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pushTooltip]);

  async function handleLogout() {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = window.location.pathname;
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

  const iconBtn =
    "relative flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-navy";

  return (
    <>
      <div className="flex items-center gap-1">
        {/* 아바타 */}
        <button
          onClick={() => setAvatarOpen(true)}
          className="relative flex h-8 w-8 items-center justify-center rounded-full transition-all hover:ring-2 hover:ring-accent/50"
          title="프로필 사진"
        >
          <Avatar avatarUrl={avatarUrl} name={name} seed={userId} size="sm" className="h-7 w-7" />
        </button>

        {/* 알림 */}
        {userId && (
          <button
            onClick={() => setNotifOpen(true)}
            className={iconBtn}
            title="알림"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            {realtimeCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {realtimeCount > 99 ? "99+" : realtimeCount}
              </span>
            )}
          </button>
        )}

        {/* 푸시 알림 */}
        {pushSupported && (
          <div ref={pushRef} className="relative">
            <button
              onClick={() => setPushTooltip(!pushTooltip)}
              className={iconBtn}
              title="푸시 알림"
            >
              {pushOn ? (
                <svg className="h-[18px] w-[18px] text-navy" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" />
                  <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.143 17.082a24.248 24.248 0 0 0 5.714 0m-5.714 0a3 3 0 1 0 5.714 0M9.143 17.082a23.848 23.848 0 0 1-5.454-1.31 8.964 8.964 0 0 0 2.312-6.022V9a6 6 0 0 1 12 0v.75a8.964 8.964 0 0 0 2.31 6.022c-1.732.64-3.56 1.085-5.455 1.31" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                </svg>
              )}
            </button>

            {/* 푸시 상태 팝업 */}
            {pushTooltip && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl bg-white p-3 shadow-xl ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-700">푸시 알림</span>
                  <button
                    onClick={handlePushToggle}
                    disabled={isPending}
                    className="relative h-5 w-9 rounded-full transition-colors disabled:opacity-50"
                    style={{ backgroundColor: pushOn ? "#002c60" : "#d1d5db" }}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${pushOn ? "left-[18px]" : "left-0.5"}`}
                    />
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-400">
                  {pushOn ? "알림이 이 기기로 전송됩니다" : "알림을 받으려면 켜주세요"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className={iconBtn}
          title="로그아웃"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
      </div>

      {/* 알림 모달 */}
      <NotificationModal open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* 아바타 변경 모달 */}
      {avatarOpen && (
        <AvatarPicker
          currentAvatarUrl={avatarUrl}
          name={name}
          seed={userId}
          onClose={() => setAvatarOpen(false)}
          onSave={(newUrl) => {
            setAvatarUrl(newUrl);
            setAvatarOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
