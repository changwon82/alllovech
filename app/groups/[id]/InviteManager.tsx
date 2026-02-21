"use client";

import { useState, useTransition } from "react";
import { createInviteLink } from "./invite-actions";

export default function InviteManager({
  groupId,
  groupName,
  inviteCode: initialCode,
}: {
  groupId: string;
  groupName: string;
  inviteCode: string | null;
}) {
  const [code, setCode] = useState(initialCode);
  const [isPending, startTransition] = useTransition();
  const [shared, setShared] = useState(false);

  function handleInvite() {
    if (code) {
      share(code);
    } else {
      startTransition(async () => {
        const result = await createInviteLink(groupId);
        if ("code" in result) {
          const newCode = result.code as string;
          setCode(newCode);
          share(newCode);
        }
      });
    }
  }

  async function share(inviteCode: string) {
    const url = `${window.location.origin}/invite/${inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${groupName} 소그룹 초대`,
          text: `${groupName} 소그룹에 초대합니다. 아래 링크를 눌러 합류하세요!`,
          url,
        });
        return;
      } catch {
        // 공유 취소 또는 미지원 — 클립보드 복사로 fallback
      }
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  return (
    <button
      onClick={handleInvite}
      disabled={isPending}
      className="mt-4 w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
    >
      {isPending ? "준비 중..." : shared ? "링크가 복사되었습니다!" : "초대하기"}
    </button>
  );
}
