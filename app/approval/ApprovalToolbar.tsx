"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRef, useTransition } from "react";

const DATE_PRESETS = [
  { key: "today", label: "오늘" },
  { key: "this-week", label: "이번주" },
  { key: "last-week", label: "지난주" },
  { key: "this-month", label: "당월" },
  { key: "last-month", label: "전월" },
];

const CATEGORIES = ["일반재정청구", "건축재정청구", "예산전용품의", "사전품의", "기타품의"];

function getDateRange(preset: string): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const dayOfWeek = today.getDay();
  switch (preset) {
    case "today":
      return { from: fmt(today), to: fmt(today) };
    case "this-week": {
      const mon = new Date(today);
      mon.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { from: fmt(mon), to: fmt(sun) };
    }
    case "last-week": {
      const mon = new Date(today);
      mon.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { from: fmt(mon), to: fmt(sun) };
    }
    case "this-month": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { from: fmt(first), to: fmt(last) };
    }
    case "last-month": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: fmt(first), to: fmt(last) };
    }
    default:
      return { from: "", to: "" };
  }
}

function buildHref(opts: {
  page?: number;
  q?: string;
  sf?: string;
  cat?: string;
  from?: string;
  to?: string;
  size?: string;
}) {
  const sp = new URLSearchParams();
  if (opts.page && opts.page > 1) sp.set("page", String(opts.page));
  if (opts.q) sp.set("q", opts.q);
  if (opts.sf && opts.sf !== "title") sp.set("sf", opts.sf);
  if (opts.cat) sp.set("cat", opts.cat);
  if (opts.from) sp.set("from", opts.from);
  if (opts.to) sp.set("to", opts.to);
  if (opts.size && opts.size !== "10") sp.set("size", opts.size);
  const qs = sp.toString();
  return `/approval${qs ? `?${qs}` : ""}`;
}

export default function ApprovalToolbar({
  isAdmin,
  catCountMap,
  totalAmount,
}: {
  isAdmin: boolean;
  catCountMap: Record<string, number>;
  totalAmount: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = params.get("q") || "";
  const searchField = params.get("sf") || "title";
  const category = params.get("cat") || "";
  const dateFrom = params.get("from") || "";
  const dateTo = params.get("to") || "";
  const size = params.get("size") || "10";

  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);
  const sfRef = useRef<HTMLSelectElement>(null);
  const qRef = useRef<HTMLInputElement>(null);

  function navigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  function handleDateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const from = dateFromRef.current?.value || "";
    const to = dateToRef.current?.value || "";
    navigate(buildHref({ q: search, sf: searchField, cat: category, from, to, size }));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sf = sfRef.current?.value || "title";
    const q = qRef.current?.value || "";
    navigate(buildHref({ q, sf, cat: category, from: dateFrom, to: dateTo, size }));
  }

  const hasFilters = search || category || dateFrom || dateTo;

  return (
    <>
      {/* 검색 툴바 */}
      <div className={`mt-2 overflow-hidden border border-neutral-400 ${isPending ? "opacity-70" : ""}`}>
        {/* 일자 행 */}
        <div className="flex items-center border-b border-neutral-400 bg-neutral-100">
          <span className="w-14 shrink-0 px-3 py-2 text-sm font-bold text-neutral-700">일자</span>
          <div className="flex flex-wrap items-center gap-2 px-2 py-1.5">
            <form onSubmit={handleDateSubmit} className="flex flex-wrap items-center gap-2">
              <input
                ref={dateFromRef}
                type="date"
                defaultValue={dateFrom}
                className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
              />
              <span className="text-sm text-neutral-400">~</span>
              <input
                ref={dateToRef}
                type="date"
                defaultValue={dateTo}
                className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded bg-neutral-600 px-3 py-1 text-sm font-medium text-white transition-all hover:bg-neutral-700 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm-10.624-2.85a5.5 5.5 0 0 1 9.201-2.465l.312.311H11.77a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .75-.75V3.536a.75.75 0 0 0-1.5 0v2.033l-.312-.311A7 7 0 0 0 2.63 8.396a.75.75 0 0 0 1.449.39l.609.788Z" clipRule="evenodd" />
                </svg>
                새로고침
              </button>
            </form>
            {DATE_PRESETS.map((preset) => {
              const range = getDateRange(preset.key);
              const isActive = dateFrom === range.from && dateTo === range.to;
              return (
                <button
                  key={preset.key}
                  onClick={() => navigate(buildHref({ q: search, sf: searchField, cat: category, from: range.from, to: range.to, size }))}
                  className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-navy text-white"
                      : "bg-neutral-500 text-white hover:bg-neutral-600"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
        {/* 검색 행 */}
        <div className="flex items-center bg-neutral-100">
          <span className="w-14 shrink-0 px-3 py-2 text-sm font-bold text-neutral-700">검색</span>
          <div className="flex flex-wrap items-center gap-2 px-2 py-1.5">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <select
                ref={sfRef}
                defaultValue={searchField}
                className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
              >
                <option value="title">문서제목</option>
                <option value="id">문서번호</option>
                <option value="author">작성자명</option>
                <option value="account">계정이름</option>
                <option value="content">본문내용</option>
              </select>
              <input
                ref={qRef}
                type="text"
                defaultValue={search}
                placeholder="검색어 입력"
                className="w-48 rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded bg-navy px-3 py-1 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                검색
              </button>
            </form>
            <Link
              href="/approval/new"
              className="inline-flex items-center gap-1 rounded bg-accent px-3 py-1 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
              </svg>
              문서작성
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/approval/members"
                  className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.175A9.953 9.953 0 0 0 8 18c1.982 0 3.83-.578 5.384-1.573.398-.254.628-.707.57-1.175a6.001 6.001 0 0 0-11.908 0ZM15.75 8.5a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5H15v-1.5a.75.75 0 0 1 .75-.75Z" />
                  </svg>
                  사용자
                </Link>
                <Link
                  href="/approval/budgets"
                  className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v.258a33.186 33.186 0 0 1 6.668.83.75.75 0 0 1-.336 1.461 31.28 31.28 0 0 0-1.103-.232l1.702 7.545a.75.75 0 0 1-.387.832A4.981 4.981 0 0 1 15 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 0 1-.387-.832l1.77-7.849a31.743 31.743 0 0 0-3.339-.254v11.505a20.01 20.01 0 0 1 3.78.501.75.75 0 1 1-.339 1.462A18.558 18.558 0 0 0 10 17.5c-1.442 0-2.845.165-4.191.477a.75.75 0 0 1-.338-1.462 20.01 20.01 0 0 1 3.779-.501V4.509c-1.129.026-2.243.112-3.34.254l1.771 7.85a.75.75 0 0 1-.387.83A4.981 4.981 0 0 1 5 14a4.981 4.981 0 0 1-2.294-.556.75.75 0 0 1-.387-.832L4.02 5.067c-.374.07-.745.15-1.103.232a.75.75 0 0 1-.336-1.462 33.186 33.186 0 0 1 6.668-.829V2.75A.75.75 0 0 1 10 2ZM5 12.662l-1.395-6.185a31.88 31.88 0 0 0-1.378.354L3.68 12.67c.42.15.87.262 1.32.329v-.338Zm6.768-6.185L10.373 12.7c.42.149.87.261 1.32.328v-.337l1.395-6.185a31.88 31.88 0 0 0-1.378-.354l.058-.015Z" clipRule="evenodd" />
                  </svg>
                  예산관리
                </Link>
              </>
            )}
            {hasFilters && (
              <button
                onClick={() => navigate("/approval")}
                className="text-sm text-neutral-400 hover:text-neutral-600"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 카테고리 탭 + 보기 선택 + 합계금액 */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => navigate(buildHref({ q: search, sf: searchField, from: dateFrom, to: dateTo, size }))}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            !category ? "bg-navy text-white" : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
          }`}
        >
          전체
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => navigate(buildHref({ q: search, sf: searchField, cat, from: dateFrom, to: dateTo, size }))}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              category === cat ? "bg-navy text-white" : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
            }`}
          >
            {cat} ({catCountMap[cat] || 0})
          </button>
        ))}

        <span className="mx-1 text-neutral-300">|</span>
        <select
          value={size}
          onChange={(e) => navigate(buildHref({ page: 1, q: search, sf: searchField, cat: category, from: dateFrom, to: dateTo, size: e.target.value }))}
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
        >
          <option value="10">보기 (10개씩)</option>
          <option value="20">보기 (20개씩)</option>
          <option value="50">보기 (50개씩)</option>
          <option value="100">보기 (100개씩)</option>
          <option value="all">보기 (전체)</option>
        </select>

        <span className="ml-auto text-sm font-medium text-neutral-500">
          합계금액 : <span className="font-bold text-navy">{totalAmount.toLocaleString("ko-KR")}원</span>
        </span>
      </div>
    </>
  );
}
