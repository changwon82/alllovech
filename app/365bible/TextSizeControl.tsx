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
  version,
  children,
}: {
  version?: string;
  children: React.ReactNode;
}) {
  const [sizeIdx, setSizeIdx] = useState(1);

  useEffect(() => {
    setSizeIdx(getSavedSize());
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-xs text-neutral-500">{version ?? ""}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">글자 크기</span>
          <button
            onClick={() => setSizeIdx((i) => { const v = Math.max(0, i - 1); localStorage.setItem(STORAGE_KEY, String(v)); return v; })}
            disabled={sizeIdx === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-sm text-neutral-600 disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-[4rem] text-center text-xs text-neutral-500">
            {SIZES[sizeIdx].label}
          </span>
          <button
            onClick={() => setSizeIdx((i) => { const v = Math.min(SIZES.length - 1, i + 1); localStorage.setItem(STORAGE_KEY, String(v)); return v; })}
            disabled={sizeIdx === SIZES.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-sm text-neutral-600 disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>
      <div className={SIZES[sizeIdx].className}>{children}</div>
    </div>
  );
}
