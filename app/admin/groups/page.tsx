import { requireAdmin } from "@/lib/admin";
import GroupManager from "./GroupManager";

export const metadata = { title: "그룹 관리 | 다애교회" };

export default async function GroupsAdminPage() {
  const { admin } = await requireAdmin();

  const [groupsResult, membersResult, profilesResult, { data: authData }] = await Promise.all([
    admin.from("groups").select("id, name, type, description, is_active").order("created_at"),
    admin.from("group_members").select("group_id, user_id, role, profiles:user_id (name)"),
    admin.from("profiles").select("id, name, status").eq("status", "active").order("name"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const providersMap: Record<string, string[]> = {};
  for (const u of authData?.users ?? []) {
    const providers = u.app_metadata?.providers as string[] | undefined;
    if (providers) providersMap[u.id] = providers;
  }

  type MemberRow = { group_id: string; user_id: string; role: string; profiles: { name: string } };

  const membersMap: Record<string, { user_id: string; role: string; name: string; providers: string[] }[]> = {};
  for (const m of (membersResult.data ?? []) as unknown as MemberRow[]) {
    if (!membersMap[m.group_id]) membersMap[m.group_id] = [];
    membersMap[m.group_id].push({
      user_id: m.user_id,
      role: m.role,
      name: m.profiles?.name ?? "이름 없음",
      providers: providersMap[m.user_id] ?? [],
    });
  }

  const groups = (groupsResult.data ?? []).map((g: { id: string; name: string; type: string; description: string | null; is_active: boolean }) => ({
    ...g,
    members: membersMap[g.id] ?? [],
  }));

  const allUsers = (profilesResult.data ?? []) as { id: string; name: string; status: string }[];

  return <GroupManager groups={groups} allUsers={allUsers} />;
}
