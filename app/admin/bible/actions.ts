"use server";

import { revalidatePath } from "next/cache";
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
  if (!roleSet.has("ADMIN")) return { error: "권한 없음" };

  return { error: null };
}

// 그룹 생성
export async function createGroup(name: string, type: "dakobang" | "family" | "free", description: string, parentId: string | null) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("groups")
    .insert({ name, type, description: description || null, parent_id: parentId || null })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };
  return { id: data.id };
}

// 그룹 수정
export async function updateGroup(groupId: string, name: string, type: "dakobang" | "family" | "free", description: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("groups")
    .update({ name, type, description: description || null })
    .eq("id", groupId);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

// 그룹 삭제
export async function deleteGroup(groupId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (deleteError) return { error: deleteError.message };
  revalidatePath("/admin/bible");
  return { success: true };
}

// 멤버 추가
export async function addMember(groupId: string, userId: string, role: "leader" | "member") {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: insertError } = await admin
    .from("group_members")
    .upsert({ group_id: groupId, user_id: userId, role }, { onConflict: "group_id,user_id" });

  if (insertError) return { error: insertError.message };
  return { success: true };
}

// 멤버 역할 변경
export async function updateMemberRole(groupId: string, userId: string, role: "leader" | "member") {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("group_members")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

// 멤버 제거
export async function removeMember(groupId: string, userId: string) {
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

// ── 함께읽기 승인 ──

export async function approveGroup(groupId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("groups")
    .update({ status: "approved" })
    .eq("id", groupId);

  if (updateError) return { error: updateError.message };
  revalidatePath("/admin/bible");
  return { success: true };
}

export async function rejectGroup(groupId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("groups")
    .update({ status: "rejected", is_active: false })
    .eq("id", groupId);

  if (updateError) return { error: updateError.message };
  revalidatePath("/admin/bible");
  return { success: true };
}
