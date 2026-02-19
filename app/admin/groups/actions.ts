"use server";

import { createClient } from "@/lib/supabase/server";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요", supabase: null };

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  if (!roleSet.has("ADMIN") && !roleSet.has("PASTOR") && !roleSet.has("STAFF")) {
    return { error: "권한 없음", supabase: null };
  }

  return { error: null, supabase };
}

export async function createGroup(name: string, type: string, description: string) {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error: error ?? "알 수 없는 오류" };

  const { data, error: insertError } = await supabase
    .from("groups")
    .insert({ name, type, description: description || null })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };
  return { groupId: data.id };
}

export async function updateGroup(groupId: string, name: string, description: string, isActive: boolean) {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error: error ?? "알 수 없는 오류" };

  const { error: updateError } = await supabase
    .from("groups")
    .update({ name, description: description || null, is_active: isActive })
    .eq("id", groupId);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

export async function addGroupMember(groupId: string, userId: string, role: string) {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error: error ?? "알 수 없는 오류" };

  const { error: insertError } = await supabase
    .from("group_members")
    .upsert(
      { group_id: groupId, user_id: userId, role },
      { onConflict: "group_id,user_id" }
    );

  if (insertError) return { error: insertError.message };
  return { success: true };
}

export async function removeGroupMember(groupId: string, userId: string) {
  const { error, supabase } = await checkAdmin();
  if (error || !supabase) return { error: error ?? "알 수 없는 오류" };

  const { error: deleteError } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };
  return { success: true };
}
