import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import ApprovalTable from "./ApprovalTable";
import LoginForm from "@/app/login/LoginForm";
import Link from "next/link";

export default async function ApprovalListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sf?: string; cat?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.q || "";
  const searchField = params.sf || "title";
  const category = params.cat || "";
  const dateFrom = params.from || "";
  const dateTo = params.to || "";
  const perPage = 20;

  const { supabase, user } = await getSessionUser();

  // 관리자 확인
  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  // 카테고리별 건수 조회 (병렬 count 쿼리)
  const categories = ["일반재정청구", "건축재정청구", "예산전용품의", "사전품의", "기타품의"];
  const [totalResult, ...catResults] = await Promise.all([
    supabase.from("approval_posts").select("id", { count: "exact", head: true }),
    ...categories.map((cat) =>
      cat === "기타품의"
        ? supabase.from("approval_posts").select("id", { count: "exact", head: true }).or("doc_category.is.null,doc_category.eq.")
        : supabase.from("approval_posts").select("id", { count: "exact", head: true }).eq("doc_category", cat),
    ),
  ]);
  const totalCount = totalResult.count ?? 0;
  const catCountMap: Record<string, number> = {};
  categories.forEach((cat, i) => { catCountMap[cat] = catResults[i].count ?? 0; });

  // 쿼리 빌드
  let query = supabase
    .from("approval_posts")
    .select(
      "id, title, author_name, requester_mb_id, amount, doc_category, doc_status, account_name, approver1_mb_id, approver1_status, approver2_mb_id, approver2_status, finance_status, payment_status, post_date, hit_count"
    )
    .order("id", { ascending: false });

  if (search) {
    const fieldMap: Record<string, string> = {
      title: "title",
      id: "id",
      author: "author_name",
      account: "account_name",
      content: "content",
    };
    const col = fieldMap[searchField] || "title";
    if (searchField === "id") {
      const numVal = parseInt(search, 10);
      if (!isNaN(numVal)) query = query.eq("id", numVal);
    } else {
      query = query.ilike(col, `%${search}%`);
    }
  }
  if (dateFrom) {
    query = query.gte("post_date", `${dateFrom}T00:00:00`);
  }
  if (dateTo) {
    query = query.lte("post_date", `${dateTo}T23:59:59`);
  }
  if (category) {
    if (category === "기타품의") {
      query = query.or("doc_category.is.null,doc_category.eq.");
    } else {
      query = query.eq("doc_category", category);
    }
  }

  const { data: posts } = await query.range(
    (page - 1) * perPage,
    page * perPage - 1
  );

  // 필터된 건수 조회
  let countQuery = supabase
    .from("approval_posts")
    .select("id", { count: "exact", head: true });
  if (search) {
    const fieldMap: Record<string, string> = { title: "title", id: "id", author: "author_name", account: "account_name", content: "content" };
    const col = fieldMap[searchField] || "title";
    if (searchField === "id") {
      const numVal = parseInt(search, 10);
      if (!isNaN(numVal)) countQuery = countQuery.eq("id", numVal);
    } else {
      countQuery = countQuery.ilike(col, `%${search}%`);
    }
  }
  if (dateFrom) countQuery = countQuery.gte("post_date", `${dateFrom}T00:00:00`);
  if (dateTo) countQuery = countQuery.lte("post_date", `${dateTo}T23:59:59`);
  if (category) {
    if (category === "기타품의") {
      countQuery = countQuery.or("doc_category.is.null,doc_category.eq.");
    } else {
      countQuery = countQuery.eq("doc_category", category);
    }
  }
  const { count: filteredCount } = await countQuery;
  const displayCount = filteredCount ?? totalCount;
  const totalPages = Math.ceil(displayCount / perPage);

  // 합계금액 (현재 페이지)
  const totalAmount = (posts || []).reduce((s, r) => s + (r.amount || 0), 0);

  // cafe24 회원명 조회
  const mbIds = new Set<string>();
  for (const p of posts || []) {
    if (p.requester_mb_id) mbIds.add(p.requester_mb_id);
    if (p.approver1_mb_id) mbIds.add(p.approver1_mb_id);
    if (p.approver2_mb_id) mbIds.add(p.approver2_mb_id);
  }
  const { data: members } = mbIds.size > 0
    ? await supabase.from("cafe24_members").select("mb_id, name").in("mb_id", Array.from(mbIds))
    : { data: [] };
  const nameMap: Record<string, string> = {};
  for (const m of members || []) {
    nameMap[m.mb_id] = m.name;
  }

  // 검색 URL 빌더
  function buildHref(p: number, q?: string, cat?: string, from?: string, to?: string, sf?: string) {
    const sp = new URLSearchParams();
    if (p > 1) sp.set("page", String(p));
    if (q) sp.set("q", q);
    if (sf && sf !== "title") sp.set("sf", sf);
    if (cat) sp.set("cat", cat);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    const qs = sp.toString();
    return `/approval${qs ? `?${qs}` : ""}`;
  }

  // 빠른 일자 필터 계산
  function getDateRange(preset: string): { from: string; to: string } {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const dayOfWeek = today.getDay(); // 0=일 1=월 ...
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

  const datePresets = [
    { key: "today", label: "오늘" },
    { key: "this-week", label: "이번주" },
    { key: "last-week", label: "지난주" },
    { key: "this-month", label: "당월" },
    { key: "last-month", label: "전월" },
  ];

  return (
    <>
      {!user ? (
        <div className="mx-auto mt-12 max-w-sm">
          <p className="mb-6 text-center text-sm text-neutral-500">재정청구는 교인 전용 서비스입니다.</p>
          <LoginForm next="/approval" />
        </div>
      ) : (<>

      {/* 검색 툴바 */}
      <div className="mt-2 overflow-hidden border border-neutral-400">
        {/* 일자 행 */}
        <div className="flex items-center border-b border-neutral-400 bg-neutral-100">
          <span className="w-14 shrink-0 px-3 py-2 text-sm font-bold text-neutral-700">일자</span>
          <div className="flex flex-wrap items-center gap-2 px-2 py-1.5">
            <form action="/approval" method="get" className="flex flex-wrap items-center gap-2">
              {category && <input type="hidden" name="cat" value={category} />}
              {search && <input type="hidden" name="q" value={search} />}
              <input
                type="date"
                name="from"
                defaultValue={dateFrom}
                className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-navy focus:outline-none"
              />
              <span className="text-sm text-neutral-400">~</span>
              <input
                type="date"
                name="to"
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
            {datePresets.map((preset) => {
              const range = getDateRange(preset.key);
              const isActive = dateFrom === range.from && dateTo === range.to;
              return (
                <a
                  key={preset.key}
                  href={buildHref(1, search, category, range.from, range.to)}
                  className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-navy text-white"
                      : "bg-neutral-500 text-white hover:bg-neutral-600"
                  }`}
                >
                  {preset.label}
                </a>
              );
            })}
          </div>
        </div>
        {/* 검색 행 */}
        <div className="flex items-center bg-neutral-100">
          <span className="w-14 shrink-0 px-3 py-2 text-sm font-bold text-neutral-700">검색</span>
          <div className="flex flex-wrap items-center gap-2 px-2 py-1.5">
            <form action="/approval" method="get" className="flex items-center gap-2">
              {category && <input type="hidden" name="cat" value={category} />}
              {dateFrom && <input type="hidden" name="from" value={dateFrom} />}
              {dateTo && <input type="hidden" name="to" value={dateTo} />}
              <select
                name="sf"
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
                type="text"
                name="q"
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
            {(search || category || dateFrom || dateTo) && (
              <a href="/approval" className="text-sm text-neutral-400 hover:text-neutral-600">
                초기화
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <a
          href={buildHref(1, search, undefined, dateFrom, dateTo)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            !category ? "bg-navy text-white" : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
          }`}
        >
          전체
        </a>
        {categories.map((cat) => (
          <a
            key={cat}
            href={buildHref(1, search, cat, dateFrom, dateTo)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              category === cat ? "bg-navy text-white" : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
            }`}
          >
            {cat} ({catCountMap[cat] || 0})
          </a>
        ))}
      </div>

      {/* 테이블 */}
      {!posts || posts.length === 0 ? (
        <p className="mt-12 text-center text-sm text-neutral-400">
          {search ? `"${search}" 검색 결과가 없습니다.` : "등록된 결재 문서가 없습니다."}
        </p>
      ) : (
        <ApprovalTable posts={posts} nameMap={nameMap} />
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 &&
        (() => {
          const pages: number[] = [];
          const start = Math.max(1, page - 7);
          const end = Math.min(totalPages, page + 7);
          for (let i = start; i <= end; i++) pages.push(i);

          const linkClass =
            "flex h-8 w-8 items-center justify-center rounded-lg text-sm text-neutral-500 hover:bg-neutral-100";
          const navClass =
            "rounded-lg px-2 py-1.5 text-sm text-neutral-400 hover:bg-neutral-100";

          return (
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                {pages[0] > 1 && (
                  <>
                    <a href={buildHref(1, search, category, dateFrom, dateTo)} className={linkClass}>1</a>
                    {pages[0] > 2 && <span className="px-1 text-sm text-neutral-300">···</span>}
                  </>
                )}
                {pages.map((p) => (
                  <a
                    key={p}
                    href={buildHref(p, search, category, dateFrom, dateTo)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                      p === page
                        ? "bg-navy font-bold text-white"
                        : "text-neutral-500 hover:bg-neutral-100"
                    }`}
                  >
                    {p}
                  </a>
                ))}
                {pages[pages.length - 1] < totalPages && (
                  <>
                    {pages[pages.length - 1] < totalPages - 1 && (
                      <span className="px-1 text-sm text-neutral-300">···</span>
                    )}
                    <a href={buildHref(totalPages, search, category, dateFrom, dateTo)} className={linkClass}>{totalPages}</a>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={buildHref(1, search, category, dateFrom, dateTo)}
                  className={`${navClass} ${page === 1 ? "pointer-events-none opacity-30" : ""}`}
                >
                  « 처음
                </a>
                <a
                  href={buildHref(Math.max(1, page - 1), search, category, dateFrom, dateTo)}
                  className={`${navClass} ${page === 1 ? "pointer-events-none opacity-30" : ""}`}
                >
                  ‹ 이전
                </a>
                <a
                  href={buildHref(Math.min(totalPages, page + 1), search, category, dateFrom, dateTo)}
                  className={`${navClass} ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}
                >
                  다음 ›
                </a>
                <a
                  href={buildHref(totalPages, search, category, dateFrom, dateTo)}
                  className={`${navClass} ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}
                >
                  마지막 »
                </a>
              </div>
              <div className="text-sm text-neutral-400">
                페이지 {page} / {totalPages} · 보기 {(page - 1) * perPage + 1} - {Math.min(page * perPage, displayCount)} / {displayCount}
              </div>
            </div>
          );
        })()}

    </>)}
    </>
  );
}
