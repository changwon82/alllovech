"use client";

import { useState, useTransition } from "react";
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
  const [step, setStep] = useState<"initial" | "confirm">(isLoggedIn ? "confirm" : "initial");

  const handleJoin = (backfill: boolean) => {
    startTransition(async () => {
      const result = await acceptInvite(code, backfill);
      if ("joined" in result || "alreadyMember" in result) {
        router.push("/365bible/groups");
      } else if ("error" in result) {
        setError(result.error as string);
      }
    });
  };

  if (error) {
    return (
      <div className="mt-6 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <a href="/" className="mt-2 inline-block text-sm font-medium text-navy hover:underline">
          홈으로 돌아가기
        </a>
      </div>
    );
  }

  // 로그인된 사용자: 이전 날짜 체크 여부 확인
  if (step === "confirm") {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl bg-accent-light p-5 text-center">
          <p className="text-sm font-medium text-neutral-700">
            참여 이전 날짜를 모두<br />
            <strong className="text-navy">읽음 처리</strong>할까요?
          </p>
        </div>

        <button
          onClick={() => handleJoin(true)}
          disabled={isPending}
          className="w-full rounded-xl bg-navy px-6 py-3 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "처리 중..." : "네, 모두 읽음 처리"}
        </button>
        <button
          onClick={() => handleJoin(false)}
          disabled={isPending}
          className="w-full rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-50 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "처리 중..." : "아니요"}
        </button>
      </div>
    );
  }

  // 비로그인 사용자: 카카오 원클릭 합류
  const handleKakaoLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/365bible/invite/${code}`)}`,
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
            href={`/login?next=${encodeURIComponent(`/365bible/invite/${code}`)}`}
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
