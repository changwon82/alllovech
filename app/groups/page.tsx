import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { getUnreadCount } from "@/lib/notifications";
import UserMenu from "@/app/components/UserMenu";
import BottomNav from "@/app/components/BottomNav";

export const metadata = { title: "내 소그룹 | 다애교회" };

const TYPE_LABEL: Record<string, string> = {
  small_group: "소그룹",
  district: "교구",
  department: "부서",
  edu_class: "반",
  one_on_one: "일대일",
};

export default async function GroupsPage() {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  // 프로필 + 역할 + 내가 속한 그룹 목록
  const [profileResult, roles, { data: memberships }, unreadCount] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
    getUserRoles(supabase, user.id),
    supabase
      .from("group_members")
      .select(`
        role,
        group:groups (
          id,
          name,
          type,
          description,
          is_active
        )
      `)
      .eq("user_id", user.id),
    getUnreadCount(supabase, user.id),
  ]);

  const userName = profileResult.data?.name ?? "이름 없음";
  const isAdmin = isAdminRole(roles);

  type GroupRow = {
    id: string;
    name: string;
    type: string;
    description: string | null;
    is_active: boolean;
  };

  const groups = (memberships ?? [])
    .filter((m) => m.group && (m.group as unknown as GroupRow).is_active)
    .map((m) => ({
      ...(m.group as unknown as GroupRow),
      myRole: m.role as string,
    }));

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20 md:pt-4 md:pb-24">
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy md:text-3xl">내 소그룹</h1>
        <UserMenu name={userName} />
      </div>
      <div className="mt-2 h-1 w-12 rounded bg-blue" />

      {groups.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-neutral-500">속한 소그룹이 없습니다</p>
          <p className="mt-1 text-sm text-neutral-400">관리자가 그룹에 배정하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="block rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-neutral-800">{g.name}</h2>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                  {TYPE_LABEL[g.type] ?? g.type}
                </span>
              </div>
              {g.description && (
                <p className="mt-1 text-sm text-neutral-500">{g.description}</p>
              )}
              {g.myRole !== "member" && (
                <p className="mt-1.5 text-xs text-blue">
                  {g.myRole === "leader" ? "그룹장" : g.myRole === "sub_leader" ? "부그룹장" : g.myRole}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <BottomNav userId={user.id} isAdmin={isAdmin} unreadCount={unreadCount} />
    </div>
  );
}
