import { requireAdmin } from "@/lib/admin";
import UserList from "./UserList";

export const metadata = { title: "사용자 관리 | 다애교회" };

export default async function UsersPage() {
  const { admin } = await requireAdmin();

  const [{ data: profiles }, { data: allRoles }, { data: authData }] = await Promise.all([
    admin.from("profiles").select("id, name, phone, status, avatar_url, created_at").order("created_at", { ascending: false }),
    admin.from("user_roles").select("user_id, role"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const rolesMap: Record<string, string[]> = {};
  for (const r of (allRoles ?? []) as { user_id: string; role: string }[]) {
    if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
    rolesMap[r.user_id].push(r.role);
  }

  const emailMap: Record<string, string> = {};
  const providersMap: Record<string, string[]> = {};
  for (const u of authData?.users ?? []) {
    if (u.email) emailMap[u.id] = u.email;
    const providers = u.app_metadata?.providers as string[] | undefined;
    if (providers) providersMap[u.id] = providers;
  }

  const users = (profiles ?? []).map((p: { id: string; name: string; phone: string | null; status: string; avatar_url: string | null; created_at: string }) => ({
    ...p,
    email: emailMap[p.id] ?? null,
    providers: providersMap[p.id] ?? [],
    roles: rolesMap[p.id] ?? [],
  }));

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800">사용자 관리</h2>
      <div className="mt-1 h-1 w-10 rounded-full bg-accent" />
      <div className="mt-6">
        <UserList users={users} />
      </div>
    </div>
  );
}
