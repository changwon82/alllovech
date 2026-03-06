"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
          router.push("/365bible/groups");
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

  // 비로그인 사용자: 카카오 원클릭 합류
  const handleKakaoLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/365bible/invite/${code}/accept`)}`,
      },
    });
  };

  return (
    <div className="mt-6 space-y-5">
      <p className="text-center text-sm text-neutral-500">
        <strong className="text-navy">{groupName}</strong>에 초대되었습니다.<br />
        아래 버튼을 눌러 바로 합류하세요.
      </p>

      <button
        onClick={handleKakaoLogin}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3.5 text-[15px] font-medium text-[#191919] transition-all hover:brightness-95 active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9 0.6C4.029 0.6 0 3.713 0 7.551c0 2.468 1.641 4.634 4.11 5.862l-1.047 3.882c-.093.344.302.614.596.407L7.88 14.87c.367.034.74.053 1.12.053 4.971 0 9-3.113 9-6.951S13.971 0.6 9 0.6Z"
            fill="#191919"
          />
        </svg>
        카카오로 합류하기
      </button>

      <div className="flex items-center gap-3 text-neutral-300">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs">또는</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <div className="space-y-1.5 text-center text-sm text-neutral-500">
        <p>
          이미 이메일 계정이 있으신가요?{" "}
          <a
            href={`/login?next=${encodeURIComponent(`/365bible/invite/${code}/accept`)}`}
            className="font-semibold text-navy hover:underline"
          >
            로그인
          </a>
        </p>
        <p>
          <a
            href={`/signup?invite=${code}`}
            className="text-neutral-400 hover:text-neutral-600 hover:underline"
          >
            이메일로 가입하기
          </a>
        </p>
      </div>
    </div>
  );
}
