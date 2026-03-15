"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";

const SECTIONS = ["예배", "목양", "재정", "총무", "선교", "교육", "설비", "기획", "기타"];
const STATUSES = ["", "재직", "조직"];

function buildHref(opts: { section?: string; dept?: string; status?: string; sf?: string; q?: string }) {
  const sp = new URLSearchParams();
  if (opts.section) sp.set("section", opts.section);
  if (opts.dept) sp.set("dept", opts.dept);
  if (opts.status) sp.set("status", opts.status);
  if (opts.sf && opts.sf !== "name") sp.set("sf", opts.sf);
  if (opts.q) sp.set("q", opts.q);
  const qs = sp.toString();
  return `/approval/members${qs ? `?${qs}` : ""}`;
}

export default function MemberToolbar({
  sectionFilter,
  deptFilter,
  statusFilter,
  search,
  searchFieldInit,
  deptList,
  memberCount,
  onCreateClick,
}: {
  sectionFilter: string;
  deptFilter: string;
  statusFilter: string;
  search: string;
  searchFieldInit: string;
  deptList: string[];
  memberCount: number;
  onCreateClick: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchField, setSearchField] = useState(searchFieldInit || "name");

  function navigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  const hasFilters = search || sectionFilter || deptFilter || statusFilter;

  return (
    <div className={`mt-4 overflow-hidden border border-neutral-400 ${isPending ? "opacity-70" : ""}`}>
      <div className="flex items-center bg-neutral-100">
        <div className="flex flex-1 flex-wrap items-center gap-4 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-700">구분</span>
            <select
              value={sectionFilter}
              onChange={(e) => navigate(buildHref({ section: e.target.value, dept: deptFilter, status: statusFilter, q: search }))}
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
            >
              <option value="">전체</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-700">부서</span>
            <select
              value={deptFilter}
              onChange={(e) => navigate(buildHref({ section: sectionFilter, dept: e.target.value, status: statusFilter, q: search }))}
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
            >
              <option value="">== 선택 ==</option>
              {deptList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-700">상태</span>
            <select
              value={statusFilter}
              onChange={(e) => navigate(buildHref({ section: sectionFilter, dept: deptFilter, status: e.target.value, q: search }))}
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
            >
              <option value="">전체</option>
              <option value="재직">재직</option>
              <option value="조직">조직</option>
              <option value="전출">전출</option>
              <option value="부재">부재</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-700">검색</span>
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
            >
              <option value="name">이름</option>
              <option value="position">직분</option>
              <option value="area">담당사역</option>
              <option value="mb_id">아이디</option>
              <option value="status">상태</option>
            </select>
            <input
              type="text"
              defaultValue={search}
              placeholder="검색어 입력"
              className="w-48 rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(buildHref({ section: sectionFilter, dept: deptFilter, status: statusFilter, sf: searchField, q: (e.target as HTMLInputElement).value }));
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('input[placeholder="검색어 입력"]');
                navigate(buildHref({ section: sectionFilter, dept: deptFilter, status: statusFilter, sf: searchField, q: input?.value || "" }));
              }}
              className="inline-flex items-center gap-1 rounded bg-navy px-3 py-1 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              검색
            </button>
          </div>
          <button
            onClick={() => navigate(buildHref({ section: sectionFilter, dept: deptFilter, status: statusFilter }))}
            className="inline-flex items-center gap-1 rounded bg-neutral-600 px-3 py-1 text-sm font-medium text-white transition-all hover:bg-neutral-700 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm-10.624-2.85a5.5 5.5 0 0 1 9.201-2.465l.312.311H11.77a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .75-.75V3.536a.75.75 0 0 0-1.5 0v2.033l-.312-.311A7 7 0 0 0 2.63 8.396a.75.75 0 0 0 1.449.39l.609.788Z" clipRule="evenodd" />
            </svg>
            새로고침
          </button>
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-1 rounded bg-accent px-3 py-1 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            신규등록
          </button>
          {hasFilters && (
            <Link href="/approval/members" className="text-sm text-neutral-400 hover:text-neutral-600">
              초기화
            </Link>
          )}
          <span className="ml-auto text-sm font-medium text-neutral-500">
            자료수 : <span className="font-bold text-navy">{memberCount}개</span>
          </span>
        </div>
      </div>
    </div>
  );
}
