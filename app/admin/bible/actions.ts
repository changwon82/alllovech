"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCode } from "@/lib/invite";

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

  return { error: null, userId: user.id };
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

// 그룹 삭제 (보관된 그룹만 삭제 가능)
export async function deleteGroup(groupId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();

  // 보관된 그룹인지 확인
  const { data: group } = await admin
    .from("groups")
    .select("is_active")
    .eq("id", groupId)
    .single();

  if (group?.is_active) return { error: "활성 그룹은 삭제할 수 없습니다. 먼저 보관하세요." };

  // 그룹에 공유된 묵상 ID 조회 → 댓글/리액션 정리
  const { data: shares } = await admin
    .from("reflection_group_shares")
    .select("reflection_id")
    .eq("group_id", groupId);

  const reflectionIds = (shares ?? []).map((s) => s.reflection_id as string);
  if (reflectionIds.length > 0) {
    await Promise.all([
      admin.from("reflection_comments").delete().in("reflection_id", reflectionIds),
      admin.from("reflection_reactions").delete().in("reflection_id", reflectionIds),
    ]);
  }

  const { error: deleteError } = await admin
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (deleteError) return { error: deleteError.message };
  revalidatePath("/admin/bible");
  return { success: true };
}

// 그룹 보관
export async function archiveGroup(groupId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("groups")
    .update({ is_active: false })
    .eq("id", groupId);

  if (updateError) return { error: updateError.message };
  revalidatePath("/admin/bible");
  revalidatePath("/365bible/groups");
  return { success: true };
}

// 그룹 복원
export async function restoreGroup(groupId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("groups")
    .update({ is_active: true })
    .eq("id", groupId);

  if (updateError) return { error: updateError.message };
  revalidatePath("/admin/bible");
  revalidatePath("/365bible/groups");
  return { success: true };
}

// 그룹 삭제 영향 범위 조회
export async function getGroupStats(groupId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const [{ count: memberCount }, { data: shares }] = await Promise.all([
    admin.from("group_members").select("*", { count: "exact", head: true }).eq("group_id", groupId),
    admin.from("reflection_group_shares").select("reflection_id").eq("group_id", groupId),
  ]);

  const shareCount = shares?.length ?? 0;
  let commentCount = 0;
  let reactionCount = 0;

  const reflectionIds = (shares ?? []).map((s) => s.reflection_id as string);
  if (reflectionIds.length > 0) {
    const [{ count: cc }, { count: rc }] = await Promise.all([
      admin.from("reflection_comments").select("*", { count: "exact", head: true }).in("reflection_id", reflectionIds),
      admin.from("reflection_reactions").select("*", { count: "exact", head: true }).in("reflection_id", reflectionIds),
    ]);
    commentCount = cc ?? 0;
    reactionCount = rc ?? 0;
  }

  return { memberCount: memberCount ?? 0, shareCount, commentCount, reactionCount };
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

// 초대 링크 생성 (기존 활성 초대가 있으면 재사용)
export async function createGroupInvite(groupId: string) {
  const { error, userId } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();

  // 기존 활성 초대 확인 (여러 개 있을 수 있으므로 limit(1))
  const { data: existingList } = await admin
    .from("group_invites")
    .select("code")
    .eq("group_id", groupId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingList && existingList.length > 0) return { code: existingList[0].code };

  // 새 초대 코드 생성
  const code = generateInviteCode();
  const { error: insertError } = await admin
    .from("group_invites")
    .insert({ group_id: groupId, code, is_active: true, created_by: userId });

  if (insertError) return { error: insertError.message };
  return { code };
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
