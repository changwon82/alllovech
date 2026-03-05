import { requireAdmin } from "@/lib/admin";
import GroupManager from "./GroupManager";
import PendingApprovals from "./PendingApprovals";

export const metadata = { title: "365 성경읽기 | 관리자 | 다애교회" };

export default async function AdminBiblePage() {
  const { admin } = await requireAdmin();

  const [
    { data: groups },
    { data: allMembers },
    { data: profiles },
    { data: pendingGroups },
  ] = await Promise.all([
    admin.from("groups").select("id, name, type, description, parent_id, created_at, status").order("created_at"),
    admin.from("group_members").select("group_id, user_id, role"),
    admin.from("profiles").select("id, name, status").order("name"),
    admin.from("groups")
      .select("id, name, type, description, start_date, end_date, created_by, created_at")
      .eq("status", "pending")
      .order("created_at"),
  ]);

  // 프로필 맵
  const profileMap: Record<string, string> = {};
  for (const p of (profiles ?? []) as { id: string; name: string }[]) {
    profileMap[p.id] = p.name;
  }

  // 멤버 맵: group_id → [{ userId, name, role }]
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

  const groupData = (groups ?? [])
    .filter((g) => (g.status as string) !== "pending")
    .map((g) => ({
      id: g.id as string,
      name: g.name as string,
      type: g.type as string,
      description: (g.description as string) ?? "",
      parentId: (g.parent_id as string) ?? null,
      members: membersMap[g.id as string] ?? [],
    }));

  const allUsers = (profiles ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    status: p.status as string,
  }));

  // 승인 대기 그룹 데이터
  type PendingRow = {
    id: string;
    name: string;
    type: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    created_by: string | null;
    created_at: string;
  };
  const pendingData = (pendingGroups ?? []).map((g) => {
    const row = g as unknown as PendingRow;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      createdBy: row.created_by ? (profileMap[row.created_by] ?? "이름 없음") : null,
      createdAt: row.created_at,
    };
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800">365 성경읽기</h2>
      <div className="mt-1 h-1 w-10 rounded-full bg-accent" />

      {pendingData.length > 0 && (
        <div className="mt-6">
          <PendingApprovals groups={pendingData} />
        </div>
      )}

      <div className="mt-6">
        <GroupManager groups={groupData} allUsers={allUsers} />
      </div>
    </div>
  );
}
