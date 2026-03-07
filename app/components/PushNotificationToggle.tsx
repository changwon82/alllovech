"use client";

import { useState, useEffect, useTransition } from "react";
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

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const ok = isPushSupported();
    setSupported(ok);
    if (ok) {
      setPermission(getNotificationPermission());
      getExistingSubscription().then((sub) => setSubscribed(!!sub)).catch(() => {});
    }
  }, []);

  // 다른 컴포넌트(UserMenu 등)에서 푸시 상태 변경 시 동기화
  useEffect(() => {
    function onPushChanged(e: Event) {
      setSubscribed((e as CustomEvent<boolean>).detail);
    }
    window.addEventListener("push-changed", onPushChanged);
    return () => window.removeEventListener("push-changed", onPushChanged);
  }, []);

  if (!supported) return null;

  if (permission === "denied") {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-base">🔕</span>
          <div>
            <p className="text-sm font-medium text-neutral-800">알림이 차단되어 있습니다</p>
            <p className="text-xs text-neutral-400">브라우저 설정에서 알림을 허용해주세요</p>
          </div>
        </div>
      </div>
    );
  }

  function handleToggle() {
    startTransition(async () => {
      try {
        if (subscribed) {
          const sub = await getExistingSubscription();
          if (sub) {
            await deletePushSubscription(sub.endpoint);
            await unsubscribePush();
          }
          setSubscribed(false);
          window.dispatchEvent(new CustomEvent("push-changed", { detail: false }));
        } else {
          const sub = await subscribePush();
          if (sub) {
            const json = sub.toJSON();
            await savePushSubscription({
              endpoint: json.endpoint!,
              keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
            });
            setSubscribed(true);
            setPermission(getNotificationPermission());
            window.dispatchEvent(new CustomEvent("push-changed", { detail: true }));
          }
        }
      } catch {
        // 서비스 워커 등록 실패 등 — 무시
      }
    });
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base">{subscribed ? "🔔" : "🔕"}</span>
          <div>
            <p className="text-sm font-medium text-neutral-800">푸시 알림</p>
            <p className="text-xs text-neutral-400">
              {subscribed ? "댓글, 공감 알림을 받고 있습니다" : "댓글, 공감 알림을 받으려면 켜주세요"}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`relative h-7 w-12 rounded-full transition-colors ${subscribed ? "bg-navy" : "bg-neutral-300"}`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${subscribed ? "left-[22px]" : "left-0.5"}`}
          />
        </button>
      </div>
    </div>
  );
}
