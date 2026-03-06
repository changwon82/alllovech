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
  if (!roleSet.has("ADMIN")) {
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

// 삭제 확인용 사용자 데이터 수량 조회
export async function getUserStats(userId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();

  const [checks, reflections, members, comments, reactions] = await Promise.all([
    admin.from("bible_checks").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("reflections").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("group_members").select("group_id, groups(name)").eq("user_id", userId),
    admin.from("reflection_comments").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("reflection_reactions").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  return {
    checks: checks.count ?? 0,
    reflections: reflections.count ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    groups: (members.data ?? []).map((m: any) => m.groups?.name ?? "알 수 없음"),
    comments: comments.count ?? 0,
    reactions: reactions.count ?? 0,
  };
}

// 사용자 완전삭제 — 각 단계 결과를 리포트로 반환
export async function deleteUser(userId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const report: string[] = [];

  // 1. groups.created_by → NULL (CASCADE 없으므로 수동 처리)
  const { count: groupsNulled } = await admin
    .from("groups")
    .update({ created_by: null }, { count: "exact" })
    .eq("created_by", userId);
  if (groupsNulled && groupsNulled > 0) {
    report.push(`그룹 생성자 해제: ${groupsNulled}개`);
  }

  // 2. 아바타 스토리지 파일 삭제
  const { data: avatarFiles } = await admin.storage.from("avatars").list(userId);
  if (avatarFiles && avatarFiles.length > 0) {
    await admin.storage.from("avatars").remove(avatarFiles.map((f) => `${userId}/${f.name}`));
    report.push(`아바타 파일 삭제: ${avatarFiles.length}개`);
  }

  // 3. CASCADE 삭제될 데이터 수량 미리 조회
  const [checks, reflections, comments, reactions, members, notifications, pushSubs] = await Promise.all([
    admin.from("bible_checks").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("reflections").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("reflection_comments").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("reflection_reactions").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("group_members").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("push_subscriptions").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  // 4. auth.users 삭제 → profiles CASCADE → 모든 데이터 자동 삭제
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return { error: deleteError.message };

  // CASCADE 삭제 결과 리포트
  const cascadeItems = [
    { label: "성경체크", count: checks.count },
    { label: "묵상", count: reflections.count },
    { label: "댓글", count: comments.count },
    { label: "반응", count: reactions.count },
    { label: "그룹 멤버십", count: members.count },
    { label: "알림", count: notifications.count },
    { label: "푸시 구독", count: pushSubs.count },
  ];
  for (const item of cascadeItems) {
    if (item.count && item.count > 0) {
      report.push(`${item.label} 삭제: ${item.count}건`);
    }
  }

  report.push("계정 및 프로필 삭제 완료");

  return { success: true, report };
}
