"use server";

import { createClient } from "@/lib/supabase/server";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요", supabase: null, user: null };

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  if (!roleSet.has("ADMIN") && !roleSet.has("PASTOR") && !roleSet.has("STAFF")) {
    return { error: "권한 없음", supabase: null, user: null };
  }

  return { error: null, supabase, user };
}

export async function updateUserStatus(userId: string, status: "active" | "pending" | "inactive") {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error: error ?? "알 수 없는 오류" };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

export async function addUserRole(userId: string, role: string) {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error: error ?? "알 수 없는 오류" };

  const { error: insertError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role", ignoreDuplicates: true });

  if (insertError) return { error: insertError.message };
  return { success: true };
}

export async function removeUserRole(userId: string, role: string) {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error: error ?? "알 수 없는 오류" };

  const { error: deleteError } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  if (deleteError) return { error: deleteError.message };
  return { success: true };
}
