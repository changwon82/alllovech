import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { redirect } from "next/navigation";
import PageHeader from "@/app/components/ui/PageHeader";
import BudgetTable from "./BudgetTable";
import Link from "next/link";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; committee?: string; account?: string }>;
}) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear().toString();
  const yearFilter = params.year || currentYear;
  const committeeFilter = params.committee || "";
  const accountFilter = params.account || "";

  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login?next=/approval/budgets");

  const roles = await getUserRoles(supabase, user.id);
  if (!isAdminRole(roles)) redirect("/approval");

  // 년도 목록 조회
  const { data: yearRows } = await supabase
    .from("approval_budgets")
    .select("year")
    .order("year", { ascending: false });
  const years = [...new Set((yearRows || []).map((r) => r.year))];

  // 조직명 목록 (선택된 년도 기준)
  let committeeQuery = supabase
    .from("approval_budgets")
    .select("committee");
  if (yearFilter !== "전체") committeeQuery = committeeQuery.eq("year", yearFilter);
  const { data: committeeRows } = await committeeQuery;
  const committees = [...new Set((committeeRows || []).filter((r) => r.committee).map((r) => r.committee as string))];

  // 계정이름 목록 (선택된 년도+조직명 기준)
  let accountQuery = supabase
    .from("approval_budgets")
    .select("account");
  if (yearFilter !== "전체") accountQuery = accountQuery.eq("year", yearFilter);
  if (committeeFilter) accountQuery = accountQuery.eq("committee", committeeFilter);
  const { data: accountRows } = await accountQuery;
  const accounts = [...new Set((accountRows || []).filter((r) => r.account).map((r) => r.account as string))];

  // 데이터 조회
  let query = supabase
    .from("approval_budgets")
    .select("*")
    .order("bg_code", { ascending: true });

  if (yearFilter !== "전체") query = query.eq("year", yearFilter);
  if (committeeFilter) query = query.eq("committee", committeeFilter);
  if (accountFilter) query = query.eq("account", accountFilter);

  const { data: budgets } = await query;

  function buildHref(year?: string, committee?: string, account?: string) {
    const sp = new URLSearchParams();
    if (year) sp.set("year", year);
    if (committee) sp.set("committee", committee);
    if (account) sp.set("account", account);
    const qs = sp.toString();
    return `/approval/budgets${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="예산관리" />
        <Link
          href="/approval"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
        >
          목록으로 돌아가기
        </Link>
      </div>

      {/* 필터 */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* 년도 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">년도</span>
          <a
            href={buildHref("전체", committeeFilter, accountFilter)}
            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
              yearFilter === "전체" ? "border-navy bg-navy text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            전체
          </a>
          {years.map((y) => (
            <a
              key={y}
              href={buildHref(y, committeeFilter, accountFilter)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                yearFilter === y ? "border-navy bg-navy text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {y}
            </a>
          ))}
        </div>

        {/* 조직명 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">조직명</span>
          <a
            href={buildHref(yearFilter, "", accountFilter)}
            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
              !committeeFilter ? "border-navy bg-navy text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            #전체
          </a>
          {committees.map((c) => (
            <a
              key={c}
              href={buildHref(yearFilter, c, "")}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                committeeFilter === c ? "border-navy bg-navy text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {c}
            </a>
          ))}
        </div>

        {/* 계정이름 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">계정이름</span>
          <a
            href={buildHref(yearFilter, committeeFilter, "")}
            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
              !accountFilter ? "border-navy bg-navy text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            #전체
          </a>
          {accounts.map((a) => (
            <a
              key={a}
              href={buildHref(yearFilter, committeeFilter, a)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                accountFilter === a ? "border-navy bg-navy text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {a}
            </a>
          ))}
        </div>
      </div>

      <BudgetTable budgets={budgets || []} />
    </>
  );
}
