"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { getInviteByCode } from "@/lib/invite";

/** 초대 수락 (로그인된 사용자용) */
export async function acceptInvite(code: string) {
  const { user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const invite = await getInviteByCode(code);
  if (!invite) return { error: "유효하지 않은 초대 링크입니다." };

  const admin = createAdminClient();

  // 이미 멤버인지 확인
  const { data: existing } = await admin
    .from("group_members")
    .select("group_id")
    .eq("group_id", invite.group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { alreadyMember: true, groupId: invite.group_id };
  }

  // 프로필을 active로 변경 (pending 상태인 경우)
  await admin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", user.id)
    .eq("status", "pending");

  // 성도(MEMBER) 역할 부여 (없으면 추가)
  await admin
    .from("user_roles")
    .upsert(
      { user_id: user.id, role: "MEMBER" },
      { onConflict: "user_id,role" }
    );

  // 그룹 멤버로 추가
  const { error: insertError } = await admin
    .from("group_members")
    .insert({ group_id: invite.group_id, user_id: user.id, role: "member" });

  if (insertError) return { error: insertError.message };

  return { joined: true, groupId: invite.group_id };
}
