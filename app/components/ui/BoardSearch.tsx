"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SearchField = "title" | "content" | "both";

export default function BoardSearch({
  table,
  basePath,
  extraParams,
  fields = ["title", "content", "both"],
  defaultField = "both",
  defaultValue = "",
}: {
  table: string;
  basePath: string;
  extraParams?: Record<string, string>;
  fields?: SearchField[];
  defaultField?: SearchField;
  defaultValue?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [field, setField] = useState<SearchField>(defaultField);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const countTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fieldLabels: Record<SearchField, string> = {
    title: "제목",
    content: "내용",
    both: "제목+내용",
  };

  function buildUrl(q: string, sf: SearchField) {
    const params = new URLSearchParams();
    if (extraParams) {
      for (const [key, val] of Object.entries(extraParams)) {
        if (val && val !== "전체") params.set(key, val);
      }
    }
    if (q) {
      params.set("q", q);
      params.set("sf", sf);
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  // 실시간 건수 조회 + 자동 검색 (debounce 400ms)
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setCount(null);
      // 검색어 지우면 바로 초기화
      clearTimeout(navTimer.current);
      navTimer.current = setTimeout(() => {
        router.replace(buildUrl("", field));
      }, 300);
      return () => clearTimeout(navTimer.current);
    }

    clearTimeout(countTimer.current);
    clearTimeout(navTimer.current);

    countTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        let q = supabase.from(table).select("id", { count: "exact", head: true });

        if (extraParams) {
          for (const [key, val] of Object.entries(extraParams)) {
            if (val && val !== "전체") q = q.eq(key, val);
          }
        }

        const term = `%${trimmed}%`;
        if (field === "title") {
          q = q.ilike("title", term);
        } else if (field === "content") {
          q = q.ilike("content", term);
        } else {
          q = q.or(`title.ilike.${term},content.ilike.${term}`);
        }

        const { count: c } = await q;
        setCount(c ?? 0);
      } catch {
        setCount(null);
      } finally {
        setLoading(false);
      }

      // 건수 조회 후 페이지 결과도 갱신
      router.replace(buildUrl(trimmed, field));
    }, 400);

    return () => {
      clearTimeout(countTimer.current);
      clearTimeout(navTimer.current);
    };
  }, [query, field, table, extraParams, basePath, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearTimeout(countTimer.current);
    clearTimeout(navTimer.current);
    router.replace(buildUrl(query.trim(), field));
  }

  return (
    <div className="mt-8">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-neutral-200">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 shrink-0 text-neutral-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        {fields.length > 1 && (
          <select
            value={field}
            onChange={(e) => setField(e.target.value as SearchField)}
            className="shrink-0 border-none bg-transparent py-0 pr-6 pl-0 text-sm text-neutral-600 outline-none focus:ring-0"
          >
            {fields.map((f) => (
              <option key={f} value={f}>{fieldLabels[f]}</option>
            ))}
          </select>
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색어를 입력하세요..."
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-navy px-5 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          검색
        </button>
      </form>
    </div>
  );
}
