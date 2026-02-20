"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErrMsg("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    setErrMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrMsg("비밀번호 변경에 실패했습니다.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-accent-light p-6 text-center shadow-sm">
        <p className="text-lg font-bold text-navy">비밀번호가 변경되었습니다</p>
        <a
          href="/365bible"
          className="mt-4 inline-block rounded-xl bg-navy px-6 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          성경읽기로 이동
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="password"
        placeholder="새 비밀번호 (6자 이상)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
      />
      <input
        type="password"
        placeholder="비밀번호 확인"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={6}
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-navy px-4 py-3 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
      >
        {loading ? "변경 중..." : "비밀번호 변경"}
      </button>
      {errMsg && <p className="text-center text-sm text-red-500">{errMsg}</p>}
    </form>
  );
}
