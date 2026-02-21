"use client";

import { useState, useTransition } from "react";
import { createInviteLink, getGroupInvites, deactivateInvite } from "./invite-actions";

type Invite = { id: string; code: string; created_at: string; expires_at: string | null };

export default function InviteManager({
  groupId,
  groupName,
  initialInvites,
}: {
  groupId: string;
  groupName: string;
  initialInvites: Invite[];
}) {
  const [invites, setInvites] = useState(initialInvites);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  function handleCreate() {
    startTransition(async () => {
      const result = await createInviteLink(groupId);
      if ("code" in result) {
        const listResult = await getGroupInvites(groupId);
        if (listResult.invites) setInvites(listResult.invites);
      }
    });
  }

  function handleDeactivate(inviteId: string) {
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    startTransition(async () => {
      await deactivateInvite(inviteId);
    });
  }

  function handleCopy(code: string) {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleShare(code: string) {
    const url = `${window.location.origin}/invite/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${groupName} 소그룹 초대`,
          text: `${groupName} 소그룹에 초대합니다. 아래 링크를 눌러 합류하세요!`,
          url,
        });
      } catch {
        handleCopy(code);
      }
    } else {
      handleCopy(code);
    }
  }

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-700">초대 링크</h3>
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          + 새 링크
        </button>
      </div>

      {invites.length === 0 ? (
        <p className="mt-2 text-xs text-neutral-400">
          아직 초대 링크가 없습니다. 새 링크를 만들어 공유하세요.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2"
            >
              <p className="min-w-0 flex-1 truncate font-mono text-xs text-neutral-600">
                /invite/{inv.code}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => handleShare(inv.code)}
                  className="rounded-lg px-2 py-1 text-xs text-navy hover:bg-navy/5"
                >
                  공유
                </button>
                <button
                  onClick={() => handleCopy(inv.code)}
                  className="rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
                >
                  {copied === inv.code ? "복사됨!" : "복사"}
                </button>
                <button
                  onClick={() => handleDeactivate(inv.id)}
                  className="rounded-lg px-2 py-1 text-xs text-neutral-300 hover:text-red-500"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
