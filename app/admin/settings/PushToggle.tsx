"use client";

import { useState, useTransition } from "react";
import { updateSetting } from "./actions";

export default function PushToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      await updateSetting("push_notifications", next ? "true" : "false");
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-neutral-800">푸시 알림</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            켜면 모든 사용자가 마이페이지에서 푸시 알림을 구독할 수 있습니다
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`relative h-7 w-12 rounded-full transition-colors ${enabled ? "bg-navy" : "bg-neutral-300"}`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${enabled ? "left-[22px]" : "left-0.5"}`}
          />
        </button>
      </div>
    </div>
  );
}
