"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function SearchBar({
  category,
  defaultValue,
}: {
  category: string;
  defaultValue: string;
}) {
  const [q, setQ] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category && category !== "전체") params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    startTransition(() => {
      router.push(`/sermon${qs ? `?${qs}` : ""}`);
    });
  }

  function handleClear() {
    setQ("");
    const params = new URLSearchParams();
    if (category && category !== "전체") params.set("category", category);
    const qs = params.toString();
    startTransition(() => {
      router.push(`/sermon${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-xl">
      <div className="relative">
        {/* 검색 아이콘 */}
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>

        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목, 본문, 설교자로 검색..."
          className="w-full rounded-full border border-neutral-200 bg-white py-3.5 pl-12 pr-28 text-sm shadow-sm transition-all placeholder:text-neutral-400 focus:border-navy focus:shadow-md focus:outline-none focus:ring-2 focus:ring-navy/10"
        />

        {/* 지우기 버튼 */}
        {q && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 transition hover:text-neutral-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* 검색 버튼 */}
        <button
          type="submit"
          disabled={isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-navy px-5 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "..." : "검색"}
        </button>
      </div>
    </form>
  );
}
