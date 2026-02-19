import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** 사용자 역할 조회 */
export async function getUserRoles(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return new Set((roles ?? []).map((r: { role: string }) => r.role));
}

/** 관리자 역할 여부 */
export function isAdminRole(roles: Set<string>): boolean {
  return roles.has("ADMIN") || roles.has("PASTOR") || roles.has("STAFF");
}

/** 관리자 권한 확인. ADMIN이 아니면 홈으로 리다이렉트 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const roleSet = await getUserRoles(supabase, user.id);

  if (!isAdminRole(roleSet)) {
    redirect("/");
  }

  return { user, roles: roleSet, supabase };
}
