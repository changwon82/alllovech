"use client";

import { useState, useTransition } from "react";
import { submitContact } from "@/app/contact/actions";

export default function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  if (!open) return null;

  function handleSubmit() {
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await submitContact(content.trim());
      if ("success" in result) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setContent("");
          onClose();
        }, 1500);
      }
    });
  }

  function handleClose() {
    if (isPending) return;
    setSent(false);
    setContent("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-base font-bold text-navy">문의하기</h2>
          <button onClick={handleClose} className="text-neutral-400 hover:text-neutral-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-accent">문의가 전송되었습니다</p>
          </div>
        ) : (
          <div className="px-5 pb-5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의 내용을 입력해주세요"
              rows={5}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-navy focus:ring-1 focus:ring-navy"
            />
            <button
              onClick={handleSubmit}
              disabled={isPending || !content.trim()}
              className="mt-3 w-full rounded-xl bg-navy py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isPending ? "전송 중..." : "전송"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
