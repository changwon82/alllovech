import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { redirect } from "next/navigation";
import MemberClientWrapper from "./MemberClientWrapper";
import Link from "next/link";

const SECTION_MAP: Record<string, number> = {
  목양: 1, 재정: 2, 총무: 3, 선교: 4, 교육: 5, 설비: 6, 기획: 7, 기타: 0,
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; dept?: string; q?: string; sf?: string; status?: string }>;
}) {
  const params = await searchParams;
  const sectionFilter = params.section || "";
  const deptFilter = params.dept || "";
  const search = params.q?.trim() || "";
  const searchField = params.sf || "name";
  const statusFilter = params.status || "";

  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login?next=/approval/members");

  const roles = await getUserRoles(supabase, user.id);
  if (!isAdminRole(roles)) redirect("/approval");

  // 부서 목록 조회
  const { data: allMembers } = await supabase
    .from("approval_members")
    .select("mb_kind");
  const deptList = [...new Set((allMembers || []).map((r) => r.mb_kind).filter(Boolean))].sort() as string[];

  let query = supabase
    .from("approval_members")
    .select("*")
    .order("id", { ascending: false });

  if (sectionFilter && sectionFilter in SECTION_MAP) {
    if (sectionFilter === "기타") {
      query = query.or("mb_section.eq.0,mb_section.eq.99");
    } else {
      query = query.eq("mb_section", SECTION_MAP[sectionFilter]);
    }
  }
  if (deptFilter) {
    query = query.eq("mb_kind", deptFilter);
  }
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (search) {
    const fieldMap: Record<string, string> = {
      name: "name",
      position: "position",
      area: "mb_area",
      mb_id: "mb_id",
      status: "status",
    };
    const col = fieldMap[searchField] || "name";
    query = query.ilike(col, `%${search}%`);
  }

  const { data: members } = await query;

  return (
    <>
      {/* 타이틀 + 돌아가기 */}
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
              <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.175A9.953 9.953 0 0 0 8 18c1.982 0 3.83-.578 5.384-1.573.398-.254.628-.707.57-1.175a6.001 6.001 0 0 0-11.908 0ZM15.75 8.5a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5H15v-1.5a.75.75 0 0 1 .75-.75Z" />
            </svg>
            사용자 관리
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

      <MemberClientWrapper
        members={members || []}
        sectionFilter={sectionFilter}
        deptFilter={deptFilter}
        statusFilter={statusFilter}
        search={search}
        searchFieldInit={searchField}
        deptList={deptList}
      />
    </>
  );
}
