import { requireAdmin } from "@/lib/admin";
import UserList from "./UserList";

export const metadata = { title: "사용자 관리 | 다애교회" };

export default async function UsersPage() {
  const { admin } = await requireAdmin();

  // profiles 전체 가져오기 (1000행씩)
  let profiles: { id: string; name: string; phone: string | null; status: string; avatar_url: string | null; created_at: string }[] = [];
  let pfFrom = 0;
  while (true) {
    const { data } = await admin.from("profiles").select("id, name, phone, status, avatar_url, created_at").order("created_at", { ascending: false }).range(pfFrom, pfFrom + 999);
    profiles = profiles.concat(data ?? []);
    if (!data || data.length < 1000) break;
    pfFrom += 1000;
  }

  const { data: allRoles } = await admin.from("user_roles").select("user_id, role");

  // auth users 전체 가져오기 (1000명씩 페이징)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allAuthUsers: any[] = [];
  let authPage = 1;
  while (true) {
    const { data } = await admin.auth.admin.listUsers({ page: authPage, perPage: 1000 });
    allAuthUsers = [...allAuthUsers, ...data.users];
    if (data.users.length < 1000) break;
    authPage++;
  }

  const rolesMap: Record<string, string[]> = {};
  for (const r of (allRoles ?? []) as { user_id: string; role: string }[]) {
    if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
    rolesMap[r.user_id].push(r.role);
  }

  const emailMap: Record<string, string> = {};
  const providersMap: Record<string, string[]> = {};
  for (const u of allAuthUsers) {
    if (u.email) emailMap[u.id] = u.email;
    const providers = u.app_metadata?.providers as string[] | undefined;
    if (providers) providersMap[u.id] = providers;
  }

  const users = profiles.map((p) => ({
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
