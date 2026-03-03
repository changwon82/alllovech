"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

export async function submitContact(content: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "내용을 입력해주세요." };

  // 사용자 이름 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();
  const userName = profile?.name ?? "이름 없음";

  // 관리자 목록 조회 (RLS 우회)
  const admin = createAdminClient();
  const { data: adminRoles } = await admin
    .from("user_roles")
    .select("user_id")
    .in("role", ["ADMIN", "PASTOR", "STAFF"]);

  const adminIds = [...new Set((adminRoles ?? []).map((r) => r.user_id))];

  // 앱 내 알림 전송
  if (adminIds.length > 0) {
    await admin.from("notifications").insert(
      adminIds.map((adminId) => ({
        user_id: adminId,
        type: "contact",
        actor_id: user.id,
        message: trimmed,
      }))
    );
  }

  // 이메일 알림
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (resendKey && adminEmail) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "다애교회 <onboarding@resend.dev>",
      to: adminEmail,
      subject: `[다애교회] ${userName}님의 문의`,
      text: `보낸 사람: ${userName}\n\n${trimmed}`,
    });
  }

  return { success: true };
}
