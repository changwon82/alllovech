"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { deleteFromR2 } from "@/lib/r2";
import { notifyApprovalAction } from "@/lib/approval-notify";

type ApprovalAction = "approve" | "reject" | "execute";

// 결재 상태 변경 (1차결재, 최종결재, 지급집행)
export async function updateApprovalStatus(
  postId: number,
  field: "approver1_status" | "approver2_status" | "finance_status" | "payment_status",
  action: ApprovalAction,
  comment?: string,
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

  // 현재 사용자의 결재 mb_id 조회
  const { data: myMember } = await admin
    .from("approval_members")
    .select("mb_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const myMbId = myMember?.mb_id || null;

  // 권한 확인: 해당 단계의 결재자이거나 관리자
  if (!isAdmin) {
    const allowed =
      (field === "approver1_status" && myMbId === post.approver1_mb_id) ||
      (field === "approver2_status" && myMbId === post.approver2_mb_id);
    // 재정/지급은 관리자만
    if (!allowed) {
      return { error: "해당 결재 단계의 권한이 없습니다." };
    }
  }

  const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).substring(0, 19);
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

  // 결재의견 기록
  const { data: myProfile } = await admin
    .from("approval_members")
    .select("name")
    .eq("user_id", user.id)
    .maybeSingle();

  const stepMap: Record<string, string> = {
    approver1_status: "approver1",
    approver2_status: "approver2",
    finance_status: "finance",
    payment_status: "payment",
  };
  const statusLabel = action === "approve" ? "승인" : action === "execute" ? "집행" : "승인취소";

  await admin.from("approval_comments").insert({
    post_id: postId,
    mb_id: myMbId || user.id,
    name: myProfile?.name || "관리자",
    step: stepMap[field],
    status: statusLabel,
    comment: comment || "",
  });

  // 알림 발송 (비동기, 실패해도 결재 처리에 영향 없음)
  notifyApprovalAction({
    postId,
    field,
    action,
    actorMbId: myMbId || user.id,
    comment: comment || undefined,
  }).catch((e) => console.error("[알림 발송 실패]", e));

  revalidatePath(`/approval/${postId}`);
  revalidatePath("/approval");
  return { success: true };
}

// 결재요청 (draft → submitted)
export async function submitForApproval(postId: number) {
  const { user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const admin = createAdminClient();

  const { data: post } = await admin
    .from("approval_posts")
    .select("requester_mb_id, doc_status")
    .eq("id", postId)
    .single();

  if (!post) return { error: "문서를 찾을 수 없습니다." };
  if (post.requester_mb_id !== user.id) {
    // 관리자도 결재요청 가능
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "ADMIN").maybeSingle();
    if (!roles) return { error: "결재요청 권한이 없습니다." };
  }
  if (post.doc_status === "submitted") return { error: "이미 결재요청된 문서입니다." };

  // 문서번호 채번: 현재 최대 doc_number + 1
  const { data: maxRow } = await admin
    .from("approval_posts")
    .select("doc_number")
    .not("doc_number", "is", null)
    .order("doc_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextDocNumber = (maxRow?.doc_number || 0) + 1;

  const { error } = await admin
    .from("approval_posts")
    .update({ doc_status: "submitted", doc_number: nextDocNumber })
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath(`/approval/${postId}`);
  revalidatePath("/approval");
  return { success: true };
}

// 결재 문서 삭제 (R2 파일 포함)
export async function deleteApprovalPost(postId: number) {
  const { user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const admin = createAdminClient();

  // 관리자 또는 작성자 확인
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "ADMIN")
    .maybeSingle();
  const isAdmin = !!roles;

  const { data: post } = await admin
    .from("approval_posts")
    .select("requester_mb_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "문서를 찾을 수 없습니다." };
  if (!isAdmin && post.requester_mb_id !== user.id) {
    return { error: "삭제 권한이 없습니다." };
  }

  // R2 파일 삭제
  const { data: files } = await admin
    .from("approval_files")
    .select("file_name")
    .eq("post_id", postId);

  if (files && files.length > 0) {
    await Promise.all(
      files.map((f) => deleteFromR2(`approval/${f.file_name}`).catch(() => {})),
    );
  }

  // DB 삭제: 세부항목 → 첨부파일 → 게시글
  await admin.from("approval_items").delete().eq("post_id", postId);
  await admin.from("approval_files").delete().eq("post_id", postId);
  const { error } = await admin.from("approval_posts").delete().eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath("/approval");
  return { success: true };
}
