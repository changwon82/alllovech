import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { redirect } from "next/navigation";
import BudgetClientWrapper from "./BudgetClientWrapper";
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
  const years = [...new Set([currentYear, ...(yearRows || []).map((r) => r.year)])].sort((a, b) => b.localeCompare(a));

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

  return (
    <>
      {/* 타이틀 + 돌아가기 */}
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
              <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v.258a33.186 33.186 0 0 1 6.668.83.75.75 0 0 1-.336 1.461 31.28 31.28 0 0 0-1.103-.232l1.702 7.545a.75.75 0 0 1-.387.832A4.981 4.981 0 0 1 15 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 0 1-.387-.832l1.77-7.849a31.743 31.743 0 0 0-3.339-.254v11.505a20.01 20.01 0 0 1 3.78.501.75.75 0 1 1-.339 1.462A18.558 18.558 0 0 0 10 17.5c-1.442 0-2.845.165-4.191.477a.75.75 0 0 1-.338-1.462 20.01 20.01 0 0 1 3.779-.501V4.509c-1.129.026-2.243.112-3.34.254l1.771 7.85a.75.75 0 0 1-.387.83A4.981 4.981 0 0 1 5 14a4.981 4.981 0 0 1-2.294-.556.75.75 0 0 1-.387-.832L4.02 5.067c-.374.07-.745.15-1.103.232a.75.75 0 0 1-.336-1.462 33.186 33.186 0 0 1 6.668-.829V2.75A.75.75 0 0 1 10 2ZM5 12.662l-1.395-6.185a31.88 31.88 0 0 0-1.378.354L3.68 12.67c.42.15.87.262 1.32.329v-.338Zm6.768-6.185L10.373 12.7c.42.149.87.261 1.32.328v-.337l1.395-6.185a31.88 31.88 0 0 0-1.378-.354l.058-.015Z" clipRule="evenodd" />
            </svg>
            예산관리
          </h2>
          <div className="mt-1.5 h-1 w-12 rounded-full bg-accent" />
        </div>
        <Link
          href="/approval"
          className="rounded border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
        >
          목록으로 돌아가기
        </Link>
      </div>

      <BudgetClientWrapper
        budgets={budgets || []}
        yearFilter={yearFilter}
        committeeFilter={committeeFilter}
        accountFilter={accountFilter}
        years={years}
        committees={committees}
        accounts={accounts}
      />
    </>
  );
}
