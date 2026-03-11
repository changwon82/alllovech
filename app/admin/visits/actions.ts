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
  if (!roleSet.has("ADMIN")) return { error: "권한 없음" };

  return { error: null };
}

export type VisitType = "new_member" | "regular" | "sick" | "birthday" | "bereavement" | "follow_up" | "other";
export type VisitStatus = "suggested" | "scheduled" | "completed" | "cancelled" | "no_show";

export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  new_member: "새신자",
  regular: "정기",
  sick: "병문안",
  birthday: "생일",
  bereavement: "조문/위로",
  follow_up: "후속",
  other: "기타",
};

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  suggested: "제안됨",
  scheduled: "예정",
  completed: "완료",
  cancelled: "취소",
  no_show: "부재",
};

export const SUGGESTION_REASONS: Record<string, string> = {
  birthday_upcoming: "생일이 다가옵니다",
  no_visit_6months: "6개월 이상 미심방",
  new_member: "새신자 심방 필요",
  follow_up_due: "후속 심방 기한 도래",
};

export type VisitRow = {
  id: string;
  member_id: string;
  visitor_ids: string[];
  visit_type: VisitType;
  status: VisitStatus;
  visit_date: string | null;
  visit_time: string | null;
  location: string | null;
  notes: string | null;
  prayer_request: string | null;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  suggestion_reason: string | null;
  created_at: string;
  updated_at: string;
  church_members: { id: string; name: string; phone: string | null; birth_date: string | null; gender: string | null } | null;
};

export type CreateVisitInput = {
  member_id: string;
  visitor_ids: string[];
  visit_type: VisitType;
  status?: VisitStatus;
  visit_date?: string;
  visit_time?: string;
  location?: string;
  notes?: string;
  prayer_request?: string;
  follow_up_needed?: boolean;
  follow_up_date?: string;
  suggestion_reason?: string;
};

export async function createVisit(input: CreateVisitInput) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("pastoral_visits")
    .insert(input)
    .select("*, church_members(id, name, phone, birth_date, gender)")
    .single();

  if (insertError) return { error: insertError.message };
  return { data };
}

export async function updateVisit(id: string, fields: Partial<CreateVisitInput>) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("pastoral_visits")
    .update(fields)
    .eq("id", id)
    .select("*, church_members(id, name, phone, birth_date, gender)")
    .single();

  if (updateError) return { error: updateError.message };
  return { data };
}

export async function deleteVisit(id: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("pastoral_visits")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };
  return { success: true };
}

export async function completeVisit(id: string, notes?: string, prayerRequest?: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const updates: Record<string, unknown> = { status: "completed" };
  if (notes !== undefined) updates.notes = notes;
  if (prayerRequest !== undefined) updates.prayer_request = prayerRequest;

  const { data, error: updateError } = await admin
    .from("pastoral_visits")
    .update(updates)
    .eq("id", id)
    .select("*, church_members(id, name, phone, birth_date, gender)")
    .single();

  if (updateError) return { error: updateError.message };
  return { data };
}

// 자동 제안 생성 (멱등성 보장)
export async function generateSuggestions() {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // 기존 suggested 상태 레코드
  const { data: existingSuggestions } = await admin
    .from("pastoral_visits")
    .select("member_id, suggestion_reason")
    .eq("status", "suggested");

  const existingSet = new Set(
    (existingSuggestions ?? []).map((s: { member_id: string; suggestion_reason: string | null }) =>
      `${s.member_id}:${s.suggestion_reason}`
    )
  );

  // 모든 교인 + 최근 심방 기록
  const [{ data: members }, { data: allVisits }] = await Promise.all([
    admin.from("church_members").select("id, name, birth_date, created_at"),
    admin.from("pastoral_visits").select("member_id, visit_type, visit_date, status, follow_up_needed, follow_up_date")
      .neq("status", "suggested")
      .neq("status", "cancelled"),
  ]);

  if (!members) return { error: "교인 데이터 없음" };

  const suggestions: CreateVisitInput[] = [];

  // 교인별 심방 기록 그룹핑
  const visitsByMember = new Map<string, typeof allVisits>();
  for (const v of allVisits ?? []) {
    const list = visitsByMember.get(v.member_id) ?? [];
    list.push(v);
    visitsByMember.set(v.member_id, list);
  }

  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const fourteenDaysLater = new Date(today);
  fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysLaterStr = sevenDaysLater.toISOString().slice(0, 10);

  for (const member of members) {
    const memberVisits = visitsByMember.get(member.id) ?? [];

    // 1. 생일 심방 제안
    if (member.birth_date) {
      const bd = member.birth_date; // YYYY-MM-DD 또는 MM-DD 형식
      const monthDay = bd.length > 5 ? bd.slice(5) : bd; // MM-DD 추출
      const thisYearBirthday = `${today.getFullYear()}-${monthDay}`;
      const bdDate = new Date(thisYearBirthday + "T00:00:00");

      if (bdDate >= today && bdDate <= fourteenDaysLater) {
        const hasThisYearBdVisit = memberVisits.some(
          (v: { visit_type: string; visit_date: string | null }) =>
            v.visit_type === "birthday" &&
            v.visit_date &&
            v.visit_date.startsWith(String(today.getFullYear()))
        );
        if (!hasThisYearBdVisit && !existingSet.has(`${member.id}:birthday_upcoming`)) {
          suggestions.push({
            member_id: member.id,
            visitor_ids: [],
            visit_type: "birthday",
            status: "suggested",
            visit_date: thisYearBirthday,
            suggestion_reason: "birthday_upcoming",
          });
        }
      }
    }

    // 2. 6개월 미심방 제안
    const lastVisitDate = memberVisits
      .filter((v: { visit_date: string | null }) => v.visit_date)
      .map((v: { visit_date: string | null }) => v.visit_date!)
      .sort()
      .pop();

    if (!lastVisitDate || lastVisitDate < sixMonthsAgoStr) {
      if (!existingSet.has(`${member.id}:no_visit_6months`)) {
        suggestions.push({
          member_id: member.id,
          visitor_ids: [],
          visit_type: "regular",
          status: "suggested",
          suggestion_reason: "no_visit_6months",
        });
      }
    }

    // 3. 새신자 심방 제안
    const memberCreated = new Date(member.created_at);
    if (memberCreated >= thirtyDaysAgo) {
      const hasNewMemberVisit = memberVisits.some(
        (v: { visit_type: string }) => v.visit_type === "new_member"
      );
      if (!hasNewMemberVisit && !existingSet.has(`${member.id}:new_member`)) {
        suggestions.push({
          member_id: member.id,
          visitor_ids: [],
          visit_type: "new_member",
          status: "suggested",
          suggestion_reason: "new_member",
        });
      }
    }

    // 4. 후속 심방 기한 도래
    const followUpDue = memberVisits.find(
      (v: { follow_up_needed: boolean; follow_up_date: string | null; status: string }) =>
        v.follow_up_needed &&
        v.follow_up_date &&
        v.follow_up_date <= sevenDaysLaterStr &&
        v.status === "completed"
    );
    if (followUpDue && !existingSet.has(`${member.id}:follow_up_due`)) {
      suggestions.push({
        member_id: member.id,
        visitor_ids: [],
        visit_type: "follow_up",
        status: "suggested",
        visit_date: (followUpDue as { follow_up_date: string }).follow_up_date,
        suggestion_reason: "follow_up_due",
      });
    }
  }

  // 일괄 삽입
  if (suggestions.length > 0) {
    const { error: insertError } = await admin
      .from("pastoral_visits")
      .insert(suggestions);
    if (insertError) return { error: insertError.message };
  }

  return { count: suggestions.length };
}

// 제안 → 예정으로 전환
export async function scheduleSuggestion(id: string) {
  return updateVisit(id, { status: "scheduled" });
}

// 제안 무시 (삭제)
export async function dismissSuggestion(id: string) {
  return deleteVisit(id);
}

// 일괄 예정 등록
export async function bulkScheduleSuggestions(ids: string[]) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("pastoral_visits")
    .update({ status: "scheduled" })
    .in("id", ids);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

// 일괄 제안 삭제
export async function bulkDismissSuggestions(ids: string[]) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("pastoral_visits")
    .delete()
    .in("id", ids);

  if (deleteError) return { error: deleteError.message };
  return { success: true };
}
