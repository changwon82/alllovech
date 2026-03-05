import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole, isGroupLeader } from "@/lib/admin";
import { getUnreadCount } from "@/lib/notifications";
import UserMenu from "@/app/components/UserMenu";
import BottomNav from "@/app/components/BottomNav";
import PageHeader from "@/app/components/ui/PageHeader";
import CreateGroupForm from "./CreateGroupForm";
import GroupCard from "./GroupCard";

export const metadata = { title: "함께읽기 | 다애교회" };


export default async function GroupsPage() {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    redirect("/login?next=/365bible/groups");
  }

  // 한국 시간 기준 오늘 day / year
  const seoulDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const [yearNum, monthNum, dayNum] = seoulDateStr.split("-").map(Number);
  const year = yearNum;
  const seoulDate = new Date(yearNum, monthNum - 1, dayNum);
  const yearStart = new Date(yearNum, 0, 0);
  const todayDay = Math.floor((seoulDate.getTime() - yearStart.getTime()) / 86400000);

  const [roles, groupLeader, profileResult, { data: memberships }, unreadCount, { data: dakobangRows }, { data: existingDakobang }] = await Promise.all([
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
          content_type,
          start_date,
          end_date,
          status
        )
      `)
      .eq("user_id", user.id),
    getUnreadCount(supabase, user.id),
    supabase
      .from("dakobang_groups")
      .select("id, name, dakobang_group_members(role, church_members(name))")
      .order("sort_order"),
    supabase
      .from("groups")
      .select("dakobang_group_id")
      .not("dakobang_group_id", "is", null)
      .neq("status", "rejected")
      .gte("start_date", `${year}-01-01`)
      .lte("start_date", `${year}-12-31`),
  ]);

  const isAdmin = isAdminRole(roles);
  const canViewGroups = isAdmin || groupLeader;
  const userName = profileResult.data?.name ?? "이름 없음";

  // 다코방 목록 + 올해 사용 여부
  type DgRow = {
    id: string;
    name: string;
    dakobang_group_members: { role: string; church_members: { name: string } | null }[];
  };
  const usedDakobangIds = new Set(
    (existingDakobang ?? []).map((g) => g.dakobang_group_id as string),
  );
  const dakobangGroups = (dakobangRows ?? []).map((dg) => {
    const row = dg as unknown as DgRow;
    const leaders = row.dakobang_group_members
      .filter((m) => m.role === "leader" && m.church_members?.name)
      .map((m) => m.church_members!.name);
    return { id: row.id, name: row.name, leaders, used: usedDakobangIds.has(row.id) };
  });

  type GroupRow = {
    id: string;
    name: string;
    type: string;
    description: string | null;
    content_type: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
  };

  const groups = (memberships ?? [])
    .filter((m) => {
      const g = m.group as unknown as GroupRow;
      if (!g) return false;
      if (g.status === "rejected") return false;
      return true;
    })
    .map((m) => ({
      ...(m.group as unknown as GroupRow),
      myRole: m.role as string,
    }));

  // 각 그룹의 멤버 조회
  const groupIds = groups.map((g) => g.id);
  let membersMap: Record<string, { userId: string; name: string; avatarUrl: string | null; role: string; checkedToday: boolean; hasReflection: boolean; lastCheckedDay: number | null; totalChecked: number }[]> = {};
  if (groupIds.length > 0) {
    const { data: allMembers } = await supabase
      .from("group_members")
      .select("group_id, user_id, role, profiles:user_id (name, avatar_url)")
      .in("group_id", groupIds);

    // 모든 그룹 멤버의 user_id 수집
    const allMemberRows = (allMembers ?? []) as unknown as { group_id: string; user_id: string; role: string; profiles: { name: string; avatar_url: string | null } }[];
    const allUserIds = [...new Set(allMemberRows.map((m) => m.user_id))];

    // 오늘 읽음 체크 + 묵상 여부 병렬 조회
    let checkedUserIds = new Set<string>();
    let reflectionUserIds = new Set<string>();
    const latestCheckMap = new Map<string, number>();
    const checkCountMap = new Map<string, number>();
    if (allUserIds.length > 0) {
      const [{ data: checks }, { data: reflections }, { data: latestChecks }] = await Promise.all([
        supabase
          .from("bible_checks")
          .select("user_id")
          .in("user_id", allUserIds)
          .eq("day", todayDay)
          .eq("year", year),
        supabase
          .from("reflections")
          .select("user_id")
          .in("user_id", allUserIds)
          .eq("day", todayDay)
          .eq("year", year),
        supabase
          .from("bible_checks")
          .select("user_id, day")
          .in("user_id", allUserIds)
          .eq("year", year)
          .order("day", { ascending: false }),
      ]);
      checkedUserIds = new Set((checks ?? []).map((c: { user_id: string }) => c.user_id));
      reflectionUserIds = new Set((reflections ?? []).map((r: { user_id: string }) => r.user_id));
      for (const c of (latestChecks ?? []) as { user_id: string; day: number }[]) {
        if (!latestCheckMap.has(c.user_id)) latestCheckMap.set(c.user_id, c.day);
        checkCountMap.set(c.user_id, (checkCountMap.get(c.user_id) ?? 0) + 1);
      }
    }

    for (const m of allMemberRows) {
      if (!membersMap[m.group_id]) membersMap[m.group_id] = [];
      membersMap[m.group_id].push({
        userId: m.user_id,
        name: m.profiles?.name ?? "이름 없음",
        avatarUrl: m.profiles?.avatar_url ?? null,
        role: m.role,
        checkedToday: checkedUserIds.has(m.user_id),
        hasReflection: reflectionUserIds.has(m.user_id),
        lastCheckedDay: latestCheckMap.get(m.user_id) ?? null,
        totalChecked: checkCountMap.get(m.user_id) ?? 0,
      });
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20 md:pt-4 md:pb-24">
      <PageHeader
        title="함께읽기"
        action={<UserMenu name={userName} canViewGroups />}
      />

      <CreateGroupForm dakobangGroups={dakobangGroups} />

      {groups.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-neutral-500">속한 함께읽기가 없습니다</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              group={{
                ...g,
                members: membersMap[g.id] ?? [],
              }}
              todayDay={todayDay}
            />
          ))}
        </div>
      )}

      <BottomNav userId={user.id} isAdmin={isAdmin} canViewGroups={canViewGroups} unreadCount={unreadCount} />
    </div>
  );
}
