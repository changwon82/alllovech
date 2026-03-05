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

export async function createDakobangGroup(data: {
  ministry_team: string;
  name: string;
  leaders: string;
  sub_leaders: string;
  members: string;
  sort_order: number;
}) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { data: row, error: insertError } = await admin
    .from("dakobang_groups")
    .insert(data)
    .select()
    .single();

  if (insertError) return { error: insertError.message };
  return { data: row };
}

export async function updateDakobangGroup(
  id: string,
  data: {
    ministry_team?: string;
    name?: string;
    leaders?: string;
    sub_leaders?: string;
    members?: string;
    sort_order?: number;
  },
) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("dakobang_groups")
    .update(data)
    .eq("id", id);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

export async function bulkUpdateDakobangGroups(
  rows: { id: string; ministry_team: string; name: string; leaders: string; sub_leaders: string; members: string; sort_order: number }[],
) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const results = await Promise.all(
    rows.map((row) =>
      admin
        .from("dakobang_groups")
        .update({
          ministry_team: row.ministry_team,
          name: row.name,
          leaders: row.leaders,
          sub_leaders: row.sub_leaders,
          members: row.members,
          sort_order: row.sort_order,
        })
        .eq("id", row.id),
    ),
  );

  const failed = results.filter((r) => r.error);
  if (failed.length) return { error: `${failed.length}개 행 저장 실패` };
  return { success: true };
}

export async function deleteAllDakobangGroups() {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("dakobang_groups")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // 전체 삭제

  if (deleteError) return { error: deleteError.message };
  return { success: true };
}

export async function deleteDakobangGroup(id: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("dakobang_groups")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };
  return { success: true };
}

// ── 다코방 ↔ 성도 관계 ──

type GroupRole = "ministry_team" | "leader" | "sub_leader" | "member";

/** 특정 그룹+역할의 멤버를 통째로 교체 */
export async function setGroupMembers(
  groupId: string,
  role: GroupRole,
  memberIds: string[],
) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();

  // 기존 삭제
  const { error: delErr } = await admin
    .from("dakobang_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("role", role);
  if (delErr) return { error: delErr.message };

  // 새로 삽입
  if (memberIds.length > 0) {
    const rows = memberIds.map((mid, i) => ({
      group_id: groupId,
      member_id: mid,
      role,
      sort_order: i,
    }));
    const { error: insErr } = await admin
      .from("dakobang_group_members")
      .insert(rows);
    if (insErr) return { error: insErr.message };
  }

  return { success: true };
}

/** 여러 그룹+역할을 한번에 저장 (전체 수정용) */
export async function bulkSetGroupMembers(
  updates: { groupId: string; role: GroupRole; memberIds: string[] }[],
) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const results = await Promise.all(
    updates.map(async (u) => {
      const res = await setGroupMembersInternal(u.groupId, u.role, u.memberIds);
      return { ...res, groupId: u.groupId, role: u.role };
    }),
  );

  const failed = results.filter((r) => "error" in r && r.error);
  if (failed.length) {
    const msgs = failed.map((r) => `${r.groupId}(${r.role}): ${"error" in r ? r.error : ""}`).join(" | ");
    return { error: `${failed.length}개 항목 저장 실패: ${msgs}` };
  }
  return { success: true };
}

/** 내부용 (checkAdmin 없이) */
async function setGroupMembersInternal(
  groupId: string,
  role: GroupRole,
  memberIds: string[],
) {
  const admin = createAdminClient();

  const { error: delErr } = await admin
    .from("dakobang_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("role", role);
  if (delErr) return { error: delErr.message };

  if (memberIds.length > 0) {
    const rows = memberIds.map((mid, i) => ({
      group_id: groupId,
      member_id: mid,
      role,
      sort_order: i,
    }));
    const { error: insErr } = await admin
      .from("dakobang_group_members")
      .insert(rows);
    if (insErr) return { error: insErr.message };
  }

  return { success: true };
}
