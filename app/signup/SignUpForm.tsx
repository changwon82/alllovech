"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  async function handleKakaoSignUp() {
    setLoading(true);
    setErrMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrMsg("카카오 로그인에 실패했습니다.");
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      setErrMsg(
        error.message.includes("already registered")
          ? "이미 등록된 이메일입니다."
          : "가입에 실패했습니다. 다시 시도해주세요."
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-accent-light p-6 text-center shadow-sm">
        <p className="text-lg font-bold text-navy">가입이 완료되었습니다</p>
        <p className="mt-2 text-sm text-neutral-600">
          관리자 승인 후 모든 기능을 이용할 수 있습니다.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-lg bg-navy px-6 py-2 text-sm font-medium text-white hover:bg-navy/90"
        >
          로그인하기
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 카카오 가입 */}
      <button
        onClick={handleKakaoSignUp}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] transition-colors hover:bg-[#FDD800] disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9 0.6C4.03 0.6 0 3.73 0 7.55C0 9.94 1.56 12.05 3.93 13.28L2.93 16.84C2.85 17.12 3.17 17.34 3.42 17.18L7.68 14.42C8.11 14.47 8.55 14.5 9 14.5C13.97 14.5 18 11.37 18 7.55C18 3.73 13.97 0.6 9 0.6Z"
            fill="#191919"
          />
        </svg>
        카카오로 시작하기
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs text-neutral-400">또는 이메일로 가입</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSignUp} className="space-y-3">
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
        />
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
        />
        <input
          type="password"
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>

        {errMsg && (
          <p className="text-center text-sm text-red-500">{errMsg}</p>
        )}
      </form>
    </div>
  );
}
