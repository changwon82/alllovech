import { requireAdmin } from "@/lib/admin";
import GroupManager from "./GroupManager";

export const metadata = { title: "그룹 관리 | 다애교회" };

export default async function GroupsAdminPage() {
  const { supabase } = await requireAdmin();

  const [groupsResult, membersResult, profilesResult] = await Promise.all([
    supabase.from("groups").select("id, name, type, description, is_active").order("created_at"),
    supabase.from("group_members").select("group_id, user_id, role, profiles:user_id (name)"),
    supabase.from("profiles").select("id, name, status").eq("status", "active").order("name"),
  ]);

  type MemberRow = { group_id: string; user_id: string; role: string; profiles: { name: string } };

  const membersMap: Record<string, { user_id: string; role: string; name: string }[]> = {};
  for (const m of (membersResult.data ?? []) as unknown as MemberRow[]) {
    if (!membersMap[m.group_id]) membersMap[m.group_id] = [];
    membersMap[m.group_id].push({
      user_id: m.user_id,
      role: m.role,
      name: m.profiles?.name ?? "이름 없음",
    });
  }

  const groups = (groupsResult.data ?? []).map((g: { id: string; name: string; type: string; description: string | null; is_active: boolean }) => ({
    ...g,
    members: membersMap[g.id] ?? [],
  }));

  const allUsers = (profilesResult.data ?? []) as { id: string; name: string; status: string }[];

  return <GroupManager groups={groups} allUsers={allUsers} />;
}
