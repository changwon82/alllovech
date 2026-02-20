"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({
  error,
  next,
}: {
  error?: string;
  next?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState(
    error === "auth" ? "인증에 실패했습니다. 다시 시도해주세요." : ""
  );

  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrMsg("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    window.location.href = next ?? "/365bible";
  }

  async function handleKakaoLogin() {
    setLoading(true);
    setErrMsg("");

    const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { scopes: "profile_nickname profile_image", redirectTo },
    });

    if (error) {
      setErrMsg("카카오 로그인에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 카카오 로그인 */}
      <button
        onClick={handleKakaoLogin}
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
        카카오로 로그인
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs text-neutral-400">또는</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* 이메일 로그인 */}
      <form onSubmit={handleEmailLogin} className="space-y-3">
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
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
        >
          {loading ? "로그인 중..." : "이메일로 로그인"}
        </button>
        <div className="text-right">
          <a href="/forgot-password" className="text-xs text-neutral-400 hover:text-navy">
            비밀번호 찾기
          </a>
        </div>
      </form>

      {errMsg && (
        <p className="text-center text-sm text-red-500">{errMsg}</p>
      )}
    </div>
  );
}
