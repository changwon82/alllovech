import { requireAdmin } from "@/lib/admin";
import GroupManager from "./GroupManager";
import PresetManager from "./PresetManager";
import type { DakobangGroupInfo, PresetRow } from "./PresetManager";

export const metadata = { title: "365 성경읽기 | 관리자 | 다애교회" };

export default async function AdminBiblePage() {
  const { admin } = await requireAdmin();

  const [
    { data: groups },
    { data: allMembers },
    { data: profiles },
    { data: dakobangGroups },
    { data: presetRows },
    { data: dakobangMembers },
  ] = await Promise.all([
    admin.from("groups").select("id, name, type, description, is_active, parent_id, created_at").order("created_at"),
    admin.from("group_members").select("group_id, user_id, role"),
    admin.from("profiles").select("id, name, status").order("name"),
    admin.from("dakobang_groups").select("id, name, sort_order").order("sort_order"),
    admin.from("bible_group_presets").select("id, dakobang_group_id, group_id"),
    admin.from("dakobang_group_members").select("group_id, member_id, role, church_members(name)").eq("role", "leader").order("sort_order"),
  ]);

  // 멤버 맵: group_id → [{ user_id, name, role }]
  const profileMap: Record<string, string> = {};
  for (const p of (profiles ?? []) as { id: string; name: string }[]) {
    profileMap[p.id] = p.name;
  }

  type MemberRow = { group_id: string; user_id: string; role: string };
  const membersMap: Record<string, { userId: string; name: string; role: string }[]> = {};
  for (const m of (allMembers ?? []) as MemberRow[]) {
    if (!membersMap[m.group_id]) membersMap[m.group_id] = [];
    membersMap[m.group_id].push({
      userId: m.user_id,
      name: profileMap[m.user_id] ?? "이름 없음",
      role: m.role,
    });
  }

  const groupData = (groups ?? []).map((g) => ({
    id: g.id as string,
    name: g.name as string,
    type: g.type as string,
    description: (g.description as string) ?? "",
    isActive: g.is_active as boolean,
    parentId: (g.parent_id as string) ?? null,
    members: membersMap[g.id as string] ?? [],
  }));

  const allUsers = (profiles ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    status: p.status as string,
  }));

  // 다코방 방장 맵: dakobang_group_id → 방장 이름[]
  type DgmRow = { group_id: string; member_id: string; role: string; church_members: { name: string } | null };
  const leaderMap: Record<string, string[]> = {};
  for (const m of (dakobangMembers ?? []) as unknown as DgmRow[]) {
    if (!leaderMap[m.group_id]) leaderMap[m.group_id] = [];
    if (m.church_members?.name) leaderMap[m.group_id].push(m.church_members.name);
  }

  const dakobangGroupData: DakobangGroupInfo[] = (dakobangGroups ?? []).map((dg) => ({
    id: dg.id as string,
    name: dg.name as string,
    leaders: leaderMap[dg.id as string] ?? [],
  }));

  const presetData: PresetRow[] = (presetRows ?? []).map((p) => ({
    id: p.id as string,
    dakobangGroupId: p.dakobang_group_id as string,
    groupId: (p.group_id as string) ?? null,
  }));

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800">365 성경읽기</h2>
      <div className="mt-1 h-1 w-10 rounded-full bg-accent" />
      <div className="mt-6">
        <GroupManager groups={groupData} allUsers={allUsers} />
      </div>
      <div className="mt-10">
        <PresetManager dakobangGroups={dakobangGroupData} presets={presetData} />
      </div>
    </div>
  );
}
