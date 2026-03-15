"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";

function buildHref(opts: { year?: string; committee?: string; account?: string }) {
  const sp = new URLSearchParams();
  if (opts.year) sp.set("year", opts.year);
  if (opts.committee) sp.set("committee", opts.committee);
  if (opts.account) sp.set("account", opts.account);
  const qs = sp.toString();
  return `/approval/budgets${qs ? `?${qs}` : ""}`;
}

export default function BudgetToolbar({
  yearFilter,
  committeeFilter,
  accountFilter,
  years,
  committees,
  accounts,
  budgetCount,
}: {
  yearFilter: string;
  committeeFilter: string;
  accountFilter: string;
  years: string[];
  committees: string[];
  accounts: string[];
  budgetCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  const hasFilters = committeeFilter || accountFilter || yearFilter === "전체";

  return (
    <div className={`mt-4 overflow-hidden border border-neutral-400 ${isPending ? "opacity-70" : ""}`}>
      <div className="flex items-center bg-neutral-100">
        <div className="flex flex-1 flex-wrap items-center gap-4 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-700">년도</span>
            <select
              value={yearFilter}
              onChange={(e) => navigate(buildHref({ year: e.target.value }))}
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
            >
              <option value="전체">전체</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-700">조직명</span>
            <select
              value={committeeFilter}
              onChange={(e) => navigate(buildHref({ year: yearFilter, committee: e.target.value }))}
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
            >
              <option value="">전체</option>
              {committees.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-700">계정이름</span>
            <select
              value={accountFilter}
              onChange={(e) => navigate(buildHref({ year: yearFilter, committee: committeeFilter, account: e.target.value }))}
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
            >
              <option value="">전체</option>
              {accounts.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => navigate(buildHref({ year: yearFilter }))}
            className="inline-flex items-center gap-1 rounded bg-neutral-600 px-3 py-1 text-sm font-medium text-white transition-all hover:bg-neutral-700 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm-10.624-2.85a5.5 5.5 0 0 1 9.201-2.465l.312.311H11.77a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .75-.75V3.536a.75.75 0 0 0-1.5 0v2.033l-.312-.311A7 7 0 0 0 2.63 8.396a.75.75 0 0 0 1.449.39l.609.788Z" clipRule="evenodd" />
            </svg>
            새로고침
          </button>
          {hasFilters && (
            <Link href="/approval/budgets" className="text-sm text-neutral-400 hover:text-neutral-600">
              초기화
            </Link>
          )}
          <span className="ml-auto text-sm font-medium text-neutral-500">
            자료수 : <span className="font-bold text-navy">{budgetCount}개</span>
          </span>
        </div>
      </div>
    </div>
  );
}
