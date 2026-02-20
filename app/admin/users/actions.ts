"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  if (!roleSet.has("ADMIN") && !roleSet.has("PASTOR") && !roleSet.has("STAFF")) {
    return { error: "권한 없음" };
  }

  return { error: null };
}

export async function updateUserStatus(userId: string, status: "active" | "pending" | "inactive") {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("profiles")
    .update({ status })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

export async function addUserRole(userId: string, role: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: insertError } = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role", ignoreDuplicates: true });

  if (insertError) return { error: insertError.message };
  return { success: true };
}

export async function removeUserRole(userId: string, role: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  if (deleteError) return { error: deleteError.message };
  return { success: true };
}
