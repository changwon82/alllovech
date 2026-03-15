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
                className="rounded bg-neutral-600 px-3 py-1 text-sm font-medium text-white transition-all hover:bg-neutral-700 active:scale-95"
              >
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
                className="rounded bg-navy px-3 py-1 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
              >
                검색
              </button>
            </form>
            <Link
              href="/approval/new"
              className="rounded bg-accent px-3 py-1 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
            >
              문서작성
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/approval/members"
                  className="rounded border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
                >
                  사용자
                </Link>
                <Link
                  href="/approval/budgets"
                  className="rounded border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
                >
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
