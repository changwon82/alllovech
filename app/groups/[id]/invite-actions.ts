"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCode } from "@/lib/invite";

/** 초대 링크 생성 (leader/sub_leader만) */
export async function createInviteLink(groupId: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // 리더 권한 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["leader", "sub_leader"].includes(membership.role)) {
    return { error: "그룹장만 초대 링크를 만들 수 있습니다." };
  }

  // 코드 생성 (충돌 시 재시도)
  const admin = createAdminClient();
  let code = generateInviteCode();
  let attempts = 0;
  while (attempts < 5) {
    const { error } = await admin
      .from("group_invites")
      .insert({ group_id: groupId, code, created_by: user.id });
    if (!error) return { code };
    code = generateInviteCode();
    attempts++;
  }

  return { error: "초대 링크 생성에 실패했습니다. 다시 시도해주세요." };
}

/** 그룹의 활성 초대 목록 조회 */
export async function getGroupInvites(groupId: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { invites: [] };

  const { data } = await supabase
    .from("group_invites")
    .select("id, code, created_at, expires_at")
    .eq("group_id", groupId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return { invites: data ?? [] };
}

/** 초대 비활성화 */
export async function deactivateInvite(inviteId: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("group_invites")
    .update({ is_active: false })
    .eq("id", inviteId);

  if (error) return { error: error.message };
  return { success: true };
}
