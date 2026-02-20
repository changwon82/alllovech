import { requireAdmin } from "@/lib/admin";
import UserList from "./UserList";

export const metadata = { title: "사용자 관리 | 다애교회" };

export default async function UsersPage() {
  const { admin } = await requireAdmin();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name, phone, status, created_at")
    .order("created_at", { ascending: false });

  const { data: allRoles } = await admin
    .from("user_roles")
    .select("user_id, role");

  const rolesMap: Record<string, string[]> = {};
  for (const r of (allRoles ?? []) as { user_id: string; role: string }[]) {
    if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
    rolesMap[r.user_id].push(r.role);
  }

  const users = (profiles ?? []).map((p: { id: string; name: string; phone: string | null; status: string; created_at: string }) => ({
    ...p,
    roles: rolesMap[p.id] ?? [],
  }));

  return <UserList users={users} />;
}
