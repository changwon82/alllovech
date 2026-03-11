import { getSessionUser } from "@/lib/supabase/server";
import PageHeader from "@/app/components/ui/PageHeader";
import BottomNav from "@/app/components/BottomNav";
import ApprovalTable from "./ApprovalTable";
import Link from "next/link";

export default async function ApprovalListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; cat?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.q || "";
  const category = params.cat || "";
  const dateFrom = params.from || "";
  const dateTo = params.to || "";
  const perPage = 20;

  const { supabase, user } = await getSessionUser();

  // 카테고리별 건수 조회 (1000행 제한 우회)
  let catCounts: { doc_category: string | null }[] = [];
  let catFrom = 0;
  while (true) {
    const { data } = await supabase
      .from("approval_posts")
      .select("doc_category")
      .range(catFrom, catFrom + 999);
    catCounts = catCounts.concat(data || []);
    if (!data || data.length < 1000) break;
    catFrom += 1000;
  }
  const catCountMap: Record<string, number> = {};
  let totalCount = 0;
  for (const r of catCounts || []) {
    totalCount++;
    const cat = r.doc_category || "기타품의";
    catCountMap[cat] = (catCountMap[cat] || 0) + 1;
  }
  const categories = ["일반재정청구", "건축재정청구", "예산전용품의", "사전품의", "기타품의"];

  // 쿼리 빌드
  let query = supabase
    .from("approval_posts")
    .select(
      "id, title, author_name, requester_mb_id, amount, doc_category, doc_status, account_name, approver1_mb_id, approver1_status, approver2_mb_id, approver2_status, finance_status, payment_status, post_date, hit_count"
    )
    .order("id", { ascending: false });

  if (search) {
    query = query.ilike("title", `%${search}%`);
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
  if (search) countQuery = countQuery.ilike("title", `%${search}%`);
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

  // 관리자 여부
  let isAdmin = false;
  if (user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "ADMIN")
      .maybeSingle();
    isAdmin = !!roles;
  }

  // 검색 URL 빌더
  function buildHref(p: number, q?: string, cat?: string, from?: string, to?: string) {
    const sp = new URLSearchParams();
    if (p > 1) sp.set("page", String(p));
    if (q) sp.set("q", q);
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
    <div className="mx-auto min-h-screen max-w-7xl px-4 pt-3 pb-20">
      <PageHeader title="재정결재" />

      {/* 일자 검색 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">일자</span>
        <form action="/approval" method="get" className="flex flex-wrap items-center gap-2">
          {category && <input type="hidden" name="cat" value={category} />}
          {search && <input type="hidden" name="q" value={search} />}
          <input
            type="date"
            name="from"
            defaultValue={dateFrom}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs focus:border-navy focus:outline-none"
          />
          <span className="text-xs text-neutral-400">~</span>
          <input
            type="date"
            name="to"
            defaultValue={dateTo}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs focus:border-navy focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-navy px-3 py-1 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            검색
          </button>
        </form>
        {(dateFrom || dateTo) && (
          <a
            href={buildHref(1, search, category)}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
          >
            새로고침
          </a>
        )}
        {datePresets.map((preset) => {
          const range = getDateRange(preset.key);
          const isActive = dateFrom === range.from && dateTo === range.to;
          return (
            <a
              key={preset.key}
              href={buildHref(1, search, category, range.from, range.to)}
              className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-navy bg-navy text-white"
                  : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {preset.label}
            </a>
          );
        })}
      </div>

      {/* 검색 + 합계 */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <form action="/approval" method="get" className="flex items-center gap-2">
          {category && <input type="hidden" name="cat" value={category} />}
          {dateFrom && <input type="hidden" name="from" value={dateFrom} />}
          {dateTo && <input type="hidden" name="to" value={dateTo} />}
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="제목 검색"
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-navy focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-navy px-4 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            검색
          </button>
          {(search || category || dateFrom || dateTo) && (
            <a href="/approval" className="text-xs text-neutral-400 hover:text-neutral-600">
              초기화
            </a>
          )}
        </form>

        <div className="flex items-center gap-3">
          <Link
            href="/approval/new"
            className="rounded-xl bg-accent px-4 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            문서작성
          </Link>
          <div className="text-sm text-neutral-500">
          자료수: <span className="font-medium text-neutral-700">{displayCount.toLocaleString("ko-KR")}</span>개
          {totalAmount > 0 && (
            <>
              <span className="mx-2">·</span>
              합계금액: <span className="font-bold text-accent">{totalAmount.toLocaleString("ko-KR")}원</span>
            </>
          )}
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <a
          href={buildHref(1, search, undefined, dateFrom, dateTo)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !category ? "bg-navy text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          }`}
        >
          전체 ({totalCount})
        </a>
        {categories.map((cat) => (
          <a
            key={cat}
            href={buildHref(1, search, cat, dateFrom, dateTo)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === cat ? "bg-navy text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
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
            "rounded-lg px-2 py-1.5 text-xs text-neutral-400 hover:bg-neutral-100";

          return (
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                {pages[0] > 1 && (
                  <>
                    <a href={buildHref(1, search, category, dateFrom, dateTo)} className={linkClass}>1</a>
                    {pages[0] > 2 && <span className="px-1 text-xs text-neutral-300">···</span>}
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
                      <span className="px-1 text-xs text-neutral-300">···</span>
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
              <div className="text-xs text-neutral-400">
                페이지 {page} / {totalPages} · 보기 {(page - 1) * perPage + 1} - {Math.min(page * perPage, displayCount)} / {displayCount}
              </div>
            </div>
          );
        })()}

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user?.id} />
    </div>
  );
}
