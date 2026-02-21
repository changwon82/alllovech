"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "../actions";

export default function InviteClient({
  code,
  groupId,
  groupName,
  isLoggedIn,
}: {
  code: string;
  groupId: string;
  groupName: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // 로그인된 사용자: 자동으로 가입 처리
  useEffect(() => {
    if (isLoggedIn) {
      startTransition(async () => {
        const result = await acceptInvite(code);
        if ("joined" in result || "alreadyMember" in result) {
          router.push(`/groups/${groupId}`);
        } else if ("error" in result) {
          setError(result.error as string);
        }
      });
    }
  }, [isLoggedIn, code, groupId, router]);

  if (isLoggedIn) {
    return (
      <div className="mt-6 text-center">
        {error ? (
          <>
            <p className="text-sm text-red-500">{error}</p>
            <a href="/" className="mt-2 inline-block text-sm font-medium text-navy hover:underline">
              홈으로 돌아가기
            </a>
          </>
        ) : (
          <p className="text-sm text-neutral-500">
            {isPending ? "그룹에 합류 중..." : "이동 중..."}
          </p>
        )}
      </div>
    );
  }

  // 비로그인 사용자: 로그인/회원가입 안내
  return (
    <div className="mt-6 space-y-3">
      <p className="text-center text-sm text-neutral-500">
        <strong className="text-navy">{groupName}</strong>에 초대되었습니다.<br />
        로그인 또는 회원가입 후 자동으로 합류됩니다.
      </p>

      <a
        href={`/login?next=${encodeURIComponent(`/invite/${code}/accept`)}`}
        className="flex w-full items-center justify-center rounded-xl bg-navy px-4 py-3 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
      >
        로그인하고 합류하기
      </a>

      <a
        href={`/signup?invite=${code}`}
        className="flex w-full items-center justify-center rounded-xl border border-navy px-4 py-3 text-sm font-medium text-navy transition-all hover:bg-navy/5 active:scale-95"
      >
        회원가입하고 합류하기
      </a>
    </div>
  );
}
