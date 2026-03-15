import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { redirect } from "next/navigation";
import PageHeader from "@/app/components/ui/PageHeader";
import MemberTable from "./MemberTable";
import Link from "next/link";

const SECTION_MAP: Record<string, number> = {
  예배: 1, 목양: 2, 재정: 3, 총무: 4, 선교: 5, 교육: 6, 설비: 7, 기획: 8, 기타: 0,
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const sectionFilter = params.section || "";
  const search = params.q?.trim() || "";
  const statusFilter = params.status || "";

  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login?next=/approval/members");

  const roles = await getUserRoles(supabase, user.id);
  if (!isAdminRole(roles)) redirect("/approval");

  let query = supabase
    .from("approval_members")
    .select("*")
    .order("id", { ascending: false });

  if (sectionFilter && sectionFilter in SECTION_MAP) {
    query = query.eq("mb_section", SECTION_MAP[sectionFilter]);
  }
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,mb_id.ilike.%${search}%`);
  }

  const { data: members } = await query;

  // URL 빌더
  function buildHref(section?: string, status?: string) {
    const sp = new URLSearchParams();
    if (section) sp.set("section", section);
    if (status) sp.set("status", status);
    if (search) sp.set("q", search);
    const qs = sp.toString();
    return `/approval/members${qs ? `?${qs}` : ""}`;
  }

  const sections = ["예배", "목양", "재정", "총무", "선교", "교육", "설비", "기획", "기타"];

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="사용자 관리" />
        <Link
          href="/approval"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
        >
          목록으로 돌아가기
        </Link>
      </div>

      {/* 구분 필터 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">구분</span>
        <a
          href={buildHref("", statusFilter)}
          className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
            !sectionFilter ? "border-navy bg-navy text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
          }`}
        >
          전체
        </a>
        {sections.map((s) => (
          <a
            key={s}
            href={buildHref(s, statusFilter)}
            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
              sectionFilter === s ? "border-navy bg-navy text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      {/* 상태 필터 + 검색 */}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">상태</span>
          {["", "재직", "조직"].map((s) => (
            <a
              key={s}
              href={buildHref(sectionFilter, s)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s ? "border-navy bg-navy text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {s || "전체"}
            </a>
          ))}
        </div>
        <form action="/approval/members" method="get" className="flex items-center gap-2">
          {sectionFilter && <input type="hidden" name="section" value={sectionFilter} />}
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="이름/아이디 검색"
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-navy focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-navy px-4 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            검색
          </button>
          {(search || sectionFilter || statusFilter) && (
            <a href="/approval/members" className="text-xs text-neutral-400 hover:text-neutral-600">
              초기화
            </a>
          )}
        </form>
      </div>

      <MemberTable members={members || []} />
    </>
  );
}
