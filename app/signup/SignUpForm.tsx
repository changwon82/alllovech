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
      <div className="rounded-xl border border-blue/20 bg-blue/5 p-6 text-center">
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
        className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
      >
        {loading ? "가입 중..." : "회원가입"}
      </button>

      {errMsg && (
        <p className="text-center text-sm text-red-500">{errMsg}</p>
      )}
    </form>
  );
}
