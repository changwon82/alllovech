"use client";

import { useState, useTransition } from "react";
import { updateSetting } from "./actions";

export default function EmailToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      await updateSetting("email_notifications", next ? "true" : "false");
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-neutral-800">이메일 알림</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            문의 접수 시 관리자 이메일({process.env.NEXT_PUBLIC_ADMIN_EMAIL || "설정된 주소"})로 알림 발송
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
