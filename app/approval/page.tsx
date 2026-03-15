import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import ApprovalTable from "./ApprovalTable";
import ApprovalToolbar from "./ApprovalToolbar";
import LoginForm from "@/app/login/LoginForm";
import Link from "next/link";

export default async function ApprovalListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sf?: string; cat?: string; from?: string; to?: string; size?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.q || "";
  const searchField = params.sf || "title";
  const category = params.cat || "";
  const dateFrom = params.from || "";
  const dateTo = params.to || "";
  const sizeParam = params.size || "20";
  const perPage = sizeParam === "all" ? 99999 : parseInt(sizeParam, 10) || 20;

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
  function buildHref(p: number, q?: string, cat?: string, from?: string, to?: string, sf?: string, size?: string) {
    const sp = new URLSearchParams();
    if (p > 1) sp.set("page", String(p));
    if (q) sp.set("q", q);
    if (sf && sf !== "title") sp.set("sf", sf);
    if (cat) sp.set("cat", cat);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    const s = size || sizeParam;
    if (s && s !== "20") sp.set("size", s);
    const qs = sp.toString();
    return `/approval${qs ? `?${qs}` : ""}`;
  }


  return (
    <>
      {!user ? (
        <div className="mx-auto mt-12 max-w-sm">
          <p className="mb-6 text-center text-sm text-neutral-500">재정청구는 교인 전용 서비스입니다.</p>
          <LoginForm next="/approval" />
        </div>
      ) : (<>

      <ApprovalToolbar isAdmin={isAdmin} catCountMap={catCountMap} />

      {/* 테이블 */}
      {!posts || posts.length === 0 ? (
        <p className="mt-12 text-center text-sm text-neutral-400">
          {search ? `"${search}" 검색 결과가 없습니다.` : "등록된 결재 문서가 없습니다."}
        </p>
      ) : (<>
        <ApprovalTable posts={posts} nameMap={nameMap} />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-sm text-neutral-500">보기</span>
            {["20", "50", "100", "all"].map((s) => (
              <Link
                key={s}
                href={buildHref(1, search, category, dateFrom, dateTo, searchField, s)}
                className={`rounded border px-2 py-0.5 text-sm font-medium transition-colors ${
                  sizeParam === s
                    ? "border-navy bg-navy text-white"
                    : "border-neutral-300 text-neutral-500 hover:bg-neutral-100"
                }`}
              >
                {s === "all" ? "전체" : s}
              </Link>
            ))}
          </div>
          <span className="text-sm font-medium text-neutral-500">
            합계금액 : <span className="font-bold text-navy">{totalAmount.toLocaleString("ko-KR")}원</span>
          </span>
        </div>
      </>)}

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
                    <Link href={buildHref(1, search, category, dateFrom, dateTo)} className={linkClass}>1</Link>
                    {pages[0] > 2 && <span className="px-1 text-sm text-neutral-300">···</span>}
                  </>
                )}
                {pages.map((p) => (
                  <Link
                    key={p}
                    href={buildHref(p, search, category, dateFrom, dateTo)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                      p === page
                        ? "bg-navy font-bold text-white"
                        : "text-neutral-500 hover:bg-neutral-100"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {pages[pages.length - 1] < totalPages && (
                  <>
                    {pages[pages.length - 1] < totalPages - 1 && (
                      <span className="px-1 text-sm text-neutral-300">···</span>
                    )}
                    <Link href={buildHref(totalPages, search, category, dateFrom, dateTo)} className={linkClass}>{totalPages}</Link>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={buildHref(1, search, category, dateFrom, dateTo)}
                  className={`${navClass} ${page === 1 ? "pointer-events-none opacity-30" : ""}`}
                >
                  « 처음
                </Link>
                <Link
                  href={buildHref(Math.max(1, page - 1), search, category, dateFrom, dateTo)}
                  className={`${navClass} ${page === 1 ? "pointer-events-none opacity-30" : ""}`}
                >
                  ‹ 이전
                </Link>
                <Link
                  href={buildHref(Math.min(totalPages, page + 1), search, category, dateFrom, dateTo)}
                  className={`${navClass} ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}
                >
                  다음 ›
                </Link>
                <Link
                  href={buildHref(totalPages, search, category, dateFrom, dateTo)}
                  className={`${navClass} ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}
                >
                  마지막 »
                </Link>
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
