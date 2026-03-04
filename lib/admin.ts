import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/** 사용자 역할 조회 */
export async function getUserRoles(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return new Set((roles ?? []).map((r: { role: string }) => r.role));
}

/** 관리자 역할 여부 (/admin 접근 권한) */
export function isAdminRole(roles: Set<string>): boolean {
  return roles.has("ADMIN");
}

/** 그룹 리더 여부 조회 */
export async function isGroupLeader(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "leader");
  return (count ?? 0) > 0;
}

/** 관리자 권한 확인. ADMIN이 아니면 홈으로 리다이렉트. admin = service role 클라이언트 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/admin");

  const user = session.user;
  const roleSet = await getUserRoles(supabase, user.id);

  if (!isAdminRole(roleSet)) {
    redirect("/");
  }

  const admin = createAdminClient();
  return { user, roles: roleSet, supabase, admin };
}
