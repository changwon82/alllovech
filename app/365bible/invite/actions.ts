"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { getInviteByCode } from "@/lib/invite";

/** 한국 시간 기준 오늘 day-of-year */
function getKoreaDayOfYear(): number {
  const seoulDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const [year, month, day] = seoulDateStr.split("-").map(Number);
  const seoulDate = new Date(year, month - 1, day);
  const yearStart = new Date(year, 0, 0);
  return Math.floor((seoulDate.getTime() - yearStart.getTime()) / 86400000);
}

function getKoreaYear(): number {
  const seoulDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  return Number(seoulDateStr.split("-")[0]);
}

/** 초대 수락 (로그인된 사용자용) */
export async function acceptInvite(code: string, backfillChecks = false) {
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

  // 이전 날짜 일괄 체크
  if (backfillChecks) {
    const todayDay = getKoreaDayOfYear();
    const year = getKoreaYear();

    // 이미 체크한 날짜 조회
    const { data: existingChecks } = await admin
      .from("bible_checks")
      .select("day")
      .eq("user_id", user.id)
      .eq("year", year);

    const checkedSet = new Set((existingChecks ?? []).map((c: { day: number }) => c.day));

    // 체크되지 않은 날짜만 INSERT
    const rows = [];
    for (let d = 1; d < todayDay; d++) {
      if (!checkedSet.has(d)) {
        rows.push({ user_id: user.id, day: d, year });
      }
    }

    if (rows.length > 0) {
      await admin.from("bible_checks").insert(rows);
    }
  }

  return { joined: true, groupId: invite.group_id };
}
