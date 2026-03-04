import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole, isGroupLeader } from "@/lib/admin";
import { getUnreadCount } from "@/lib/notifications";
import UserMenu from "@/app/components/UserMenu";
import BottomNav from "@/app/components/BottomNav";
import PageHeader from "@/app/components/ui/PageHeader";
import Badge from "@/app/components/ui/Badge";
import PresetCards from "./PresetCards";

export const metadata = { title: "함께읽기 | 다애교회" };

const TYPE_LABEL: Record<string, string> = {
  ministry: "사역",
  group: "그룹",
};

export default async function GroupsPage() {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    redirect("/login?next=/365bible/groups");
  }

  // 역할 + 그룹 리더 여부 + 데이터를 병렬 조회
  const [roles, groupLeader, profileResult, { data: memberships }, unreadCount, { data: presetRows }] = await Promise.all([
    getUserRoles(supabase, user.id),
    isGroupLeader(supabase, user.id),
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
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
    supabase
      .from("bible_group_presets")
      .select("id, group_id, dakobang_groups(name, dakobang_group_members(role, church_members(name)))")
      .eq("is_active", true)
      .is("group_id", null),
  ]);

  const isAdmin = isAdminRole(roles);
  const canViewGroups = isAdmin || groupLeader;

  const userName = profileResult.data?.name ?? "이름 없음";

  // 사용 가능한 프리셋 (group_id IS NULL, is_active = TRUE)
  type PresetDbRow = {
    id: string;
    group_id: string | null;
    dakobang_groups: {
      name: string;
      dakobang_group_members: { role: string; church_members: { name: string } | null }[];
    } | null;
  };
  const availablePresets = (presetRows ?? []).map((p) => {
    const row = p as unknown as PresetDbRow;
    const leaders = (row.dakobang_groups?.dakobang_group_members ?? [])
      .filter((m) => m.role === "leader" && m.church_members?.name)
      .map((m) => m.church_members!.name);
    return {
      id: row.id,
      name: row.dakobang_groups?.name ?? "다코방",
      leaders,
    };
  });

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

  // 각 그룹의 멤버 이름 조회
  const groupIds = groups.map((g) => g.id);
  let membersMap: Record<string, string[]> = {};
  if (groupIds.length > 0) {
    const { data: allMembers } = await supabase
      .from("group_members")
      .select("group_id, profiles:user_id (name)")
      .in("group_id", groupIds);

    for (const m of (allMembers ?? []) as unknown as { group_id: string; profiles: { name: string } }[]) {
      if (!membersMap[m.group_id]) membersMap[m.group_id] = [];
      membersMap[m.group_id].push(m.profiles?.name ?? "이름 없음");
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20 md:pt-4 md:pb-24">
      <PageHeader
        title="함께읽기"
        action={<UserMenu name={userName} canViewGroups />}
      />

      {availablePresets.length > 0 && (isAdmin || groupLeader) && (
        <PresetCards presets={availablePresets} />
      )}

      {groups.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-neutral-500">속한 함께읽기 그룹이 없습니다</p>
          <p className="mt-1 text-sm text-neutral-400">관리자가 그룹에 배정하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/365bible/groups/${g.id}`}
              className="block rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-neutral-800">{g.name}</h2>
                  {membersMap[g.id] && membersMap[g.id].length > 0 && (
                    <span className="text-xs text-neutral-400">
                      {membersMap[g.id].join(", ")}
                    </span>
                  )}
                </div>
                <Badge variant="default">
                  {TYPE_LABEL[g.type] ?? g.type}
                </Badge>
              </div>
              {g.description && (
                <p className="mt-1 text-sm text-neutral-500">{g.description}</p>
              )}
              {g.myRole === "leader" && (
                <Badge variant="accent" className="mt-1.5">
                  그룹장
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}

      <BottomNav userId={user.id} isAdmin={isAdmin} canViewGroups={canViewGroups} unreadCount={unreadCount} />
    </div>
  );
}
