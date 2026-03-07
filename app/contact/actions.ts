"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { sendPushToUsers } from "@/lib/push";
import { contactPushPayload } from "@/lib/push-messages";

export async function submitContact(content: string, imageUrls: string[] = []) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmed = content.trim();
  if (!trimmed && imageUrls.length === 0) return { error: "내용을 입력해주세요." };

  // 사용자 이름 + 관리자 목록 + 이메일 설정 병렬 조회
  const admin = createAdminClient();
  const [{ data: profile }, { data: adminRoles }, { data: emailSetting }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
    admin.from("user_roles").select("user_id").eq("role", "ADMIN"),
    admin.from("admin_settings").select("value").eq("key", "email_notifications").maybeSingle(),
  ]);

  const userName = profile?.name ?? "이름 없음";
  const adminIds = [...new Set((adminRoles ?? []).map((r) => r.user_id))];

  // 이메일 알림 (설정이 켜져 있을 때만, fire-and-forget)
  const emailEnabled = emailSetting?.value === "true";
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (emailEnabled && resendKey && adminEmail) {
    const resend = new Resend(resendKey);
    resend.emails.send({
      from: "다애교회 <onboarding@resend.dev>",
      to: adminEmail,
      subject: `[다애교회] ${userName}님의 문의`,
      text: `보낸 사람: ${userName}\n\n${trimmed}${imageUrls.length > 0 ? `\n\n첨부 이미지:\n${imageUrls.join("\n")}` : ""}`,
    }).catch(() => {});
  }

  // 앱 내 알림 전송 (이것만 await — 클라이언트 응답 속도 결정)
  if (adminIds.length > 0) {
    await admin.from("notifications").insert(
      adminIds.map((adminId) => ({
        user_id: adminId,
        type: "contact",
        actor_id: user.id,
        message: trimmed + (imageUrls.length > 0 ? `\n${imageUrls.join("\n")}` : ""),
      }))
    );

    // 푸시 알림 (fire-and-forget)
    sendPushToUsers(adminIds, contactPushPayload(userName)).catch(() => {});
  }

  return { success: true };
}
