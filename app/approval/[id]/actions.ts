"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type ApprovalAction = "approve" | "reject" | "execute";

// 결재 상태 변경 (1차결재, 최종결재, 지급집행)
export async function updateApprovalStatus(
  postId: number,
  field: "approver1_status" | "approver2_status" | "finance_status" | "payment_status",
  action: ApprovalAction,
) {
  const { user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const admin = createAdminClient();

  // 관리자 확인
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "ADMIN")
    .maybeSingle();
  const isAdmin = !!roles;

  // 게시글 조회
  const { data: post } = await admin
    .from("approval_posts")
    .select("approver1_mb_id, approver2_mb_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "문서를 찾을 수 없습니다." };

  // 권한 확인: 해당 결재자이거나 관리자
  // cafe24 mb_id 기반 매칭 또는 관리자
  if (!isAdmin) {
    // 일반 사용자의 경우 cafe24_members에서 mb_id 확인
    // (현재 로그인 사용자와 결재자 매칭은 관리자만 가능하도록 제한)
    return { error: "관리자만 결재 상태를 변경할 수 있습니다." };
  }

  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  let statusValue: string;

  switch (action) {
    case "approve":
      statusValue = `1|${now}`;
      break;
    case "execute":
      statusValue = `4|${now}`;
      break;
    case "reject":
      statusValue = "0|0";
      break;
    default:
      return { error: "잘못된 액션입니다." };
  }

  const { error } = await admin
    .from("approval_posts")
    .update({ [field]: statusValue })
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath(`/approval/${postId}`);
  revalidatePath("/approval");
  return { success: true };
}
