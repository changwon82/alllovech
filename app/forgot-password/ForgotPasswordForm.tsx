"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setErrMsg("이메일 전송에 실패했습니다.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-blue/20 bg-blue/5 p-6 text-center">
        <p className="text-lg font-bold text-navy">이메일을 확인해주세요</p>
        <p className="mt-2 text-sm text-neutral-600">
          비밀번호 재설정 링크를 보냈습니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
      >
        {loading ? "전송 중..." : "재설정 링크 보내기"}
      </button>
      {errMsg && <p className="text-center text-sm text-red-500">{errMsg}</p>}
    </form>
  );
}
