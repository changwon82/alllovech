"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "bible-text-size";

const SIZES = [
  { label: "작게", className: "text-sm leading-relaxed" },
  { label: "보통", className: "text-base leading-relaxed" },
  { label: "크게", className: "text-lg leading-loose" },
  { label: "아주 크게", className: "text-xl leading-loose" },
];

function getSavedSize(): number {
  if (typeof window === "undefined") return 1;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    const n = parseInt(saved);
    if (n >= 0 && n < SIZES.length) return n;
  }
  return 1;
}

export default function TextSizeControl({
  headerLeft,
  subRow,
  children,
}: {
  headerLeft?: React.ReactNode;
  subRow?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [sizeIdx, setSizeIdx] = useState(1);

  useEffect(() => {
    setSizeIdx(getSavedSize());
  }, []);

  return (
    <div>
      <div className="mb-4">
        {/* 번역 버튼 + 글자 크기 −/+ */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1">{headerLeft ?? null}</div>
          <button
            onClick={() => setSizeIdx((i) => { const v = Math.max(0, i - 1); localStorage.setItem(STORAGE_KEY, String(v)); return v; })}
            disabled={sizeIdx === 0}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-sm text-neutral-600 disabled:opacity-30"
          >
            −
          </button>
          {sizeIdx !== 1 && (
            <button
              onClick={() => { setSizeIdx(1); localStorage.setItem(STORAGE_KEY, "1"); }}
              className="flex h-7 shrink-0 items-center justify-center rounded-lg border border-neutral-200 px-1.5 text-[11px] text-neutral-500"
            >
              기본
            </button>
          )}
          <button
            onClick={() => setSizeIdx((i) => { const v = Math.min(SIZES.length - 1, i + 1); localStorage.setItem(STORAGE_KEY, String(v)); return v; })}
            disabled={sizeIdx === SIZES.length - 1}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-sm text-neutral-600 disabled:opacity-30"
          >
            +
          </button>
        </div>
        {/* 하위 행 */}
        {subRow && <div className="mt-1.5">{subRow}</div>}
      </div>
      <div className={SIZES[sizeIdx].className}>{children}</div>
    </div>
  );
}
