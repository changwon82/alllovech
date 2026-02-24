"use client";

import { useState } from "react";
import LoginForm from "@/app/login/LoginForm";

export default function LoginButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:border-navy hover:text-navy"
      >
        로그인
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-lg text-neutral-400 hover:text-neutral-600">✕</button>
            <h2 className="mb-4 text-lg font-bold text-navy">로그인</h2>
            <LoginForm next="/365bible" />
            <p className="mt-4 text-center text-sm text-neutral-500">
              아직 계정이 없으신가요? <a href="/signup" className="font-medium text-navy hover:underline">회원가입</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
