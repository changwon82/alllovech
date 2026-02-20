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

export async function createGroup(name: string, type: string, description: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("groups")
    .insert({ name, type, description: description || null })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };
  return { groupId: data.id };
}

export async function updateGroup(groupId: string, name: string, description: string, isActive: boolean) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("groups")
    .update({ name, description: description || null, is_active: isActive })
    .eq("id", groupId);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

export async function addGroupMember(groupId: string, userId: string, role: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: insertError } = await admin
    .from("group_members")
    .upsert(
      { group_id: groupId, user_id: userId, role },
      { onConflict: "group_id,user_id" }
    );

  if (insertError) return { error: insertError.message };
  return { success: true };
}

export async function removeGroupMember(groupId: string, userId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };
  return { success: true };
}
