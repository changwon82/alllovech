"use server";

import { createClient, getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 다코방 함께읽기 생성 (즉시 승인)
export async function createDakobangGroup(
  dakobangGroupId: string,
  phoneLast4: string,
  startDate: string,
  endDate: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  if (!phoneLast4 || phoneLast4.length !== 4 || !/^\d{4}$/.test(phoneLast4)) {
    return { error: "핸드폰 뒷자리 4자리를 정확히 입력해주세요" };
  }

  const admin = createAdminClient();

  // 다코방 정보 조회
  const { data: dg, error: dgError } = await admin
    .from("dakobang_groups")
    .select("id, name")
    .eq("id", dakobangGroupId)
    .single();

  if (dgError || !dg) return { error: "다코방을 찾을 수 없습니다" };

  // 같은 연도 중복 체크
  const year = new Date(startDate).getFullYear();
  const { data: existing } = await admin
    .from("groups")
    .select("id")
    .eq("dakobang_group_id", dakobangGroupId)
    .neq("status", "rejected")
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "이미 올해 함께읽기가 생성되었습니다" };
  }

  // 방장 전화번호 + 이름 검증
  const { data: leaderMembers } = await admin
    .from("dakobang_group_members")
    .select("church_members(name, phone)")
    .eq("group_id", dakobangGroupId)
    .eq("role", "leader");

  const leaderInfos = (leaderMembers ?? [])
    .map((m) => m.church_members as unknown as { name: string; phone: string | null })
    .filter(Boolean);
  const phones = leaderInfos
    .map((l) => l.phone)
    .filter(Boolean) as string[];

  const matched = phones.some((p) => p.replace(/\D/g, "").slice(-4) === phoneLast4);
  if (!matched) return { error: "전화번호가 일치하지 않습니다" };

  // 그룹 생성 (즉시 approved)
  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({
      name: dg.name,
      type: "dakobang",
      content_type: "365bible",
      start_date: startDate,
      end_date: endDate,
      dakobang_group_id: dakobangGroupId,
      dakobang_leaders: leaderInfos.map((l) => l.name),
      status: "approved",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (groupError || !group) return { error: groupError?.message ?? "그룹 생성 실패" };

  // 현재 유저를 leader로 추가
  await admin
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "leader" });

  return { groupId: group.id };
}

// 가족/자유 함께읽기 생성 (승인 대기)
export async function createFamilyOrFreeGroup(
  name: string,
  type: "family" | "free",
  description: string,
  contentType: string,
  startDate: string,
  endDate: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  if (!name.trim()) return { error: "그룹 이름을 입력해주세요" };

  const admin = createAdminClient();

  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({
      name: name.trim(),
      type,
      description: description.trim() || null,
      content_type: contentType,
      start_date: startDate,
      end_date: endDate,
      status: "pending",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (groupError || !group) return { error: groupError?.message ?? "그룹 생성 실패" };

  // 현재 유저를 leader로 추가
  await admin
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "leader" });

  return { groupId: group.id };
}

// 그룹 피드 데이터 조회
export async function getGroupFeedData(groupId: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인 필요" };

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return { error: "그룹 멤버가 아닙니다" };

  const year = Number(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }).split("-")[0]);

  const [groupResult, inviteResult, sharesResult] = await Promise.all([
    supabase.from("groups").select("id, name, type, description").eq("id", groupId).maybeSingle(),
    membership.role === "leader"
      ? supabase.from("group_invites").select("code").eq("group_id", groupId).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("reflection_group_shares")
      .select(`
        reflection:reflections (
          id, day, year, content, created_at, user_id,
          profiles:user_id (name, avatar_url)
        )
      `)
      .eq("group_id", groupId)
      .order("reflection_id", { ascending: false }),
  ]);

  if (!groupResult.data) return { error: "그룹을 찾을 수 없습니다" };

  type ReflectionRow = {
    id: string; day: number; year: number; content: string;
    created_at: string; user_id: string;
    profiles: { name: string; avatar_url: string | null };
  };

  const reflections = (sharesResult.data ?? [])
    .map((s) => s.reflection as unknown as ReflectionRow)
    .filter(Boolean)
    .filter((r) => r.year === year);

  const reflectionIds = reflections.map((r) => r.id);
  let commentsMap: Record<string, { id: string; content: string; created_at: string; user_id: string; parent_id: string | null; profiles: { name: string } }[]> = {};
  // 리액션: 타입별 카운트 + 내 리액션
  let reactionsMap: Record<string, Record<string, number>> = {};
  let myReactionMap: Record<string, string | null> = {};

  if (reflectionIds.length > 0) {
    const [commentsResult, reactionsResult, myReactionsResult] = await Promise.all([
      supabase.from("reflection_comments").select("id, reflection_id, content, created_at, user_id, parent_id, profiles:user_id (name)").in("reflection_id", reflectionIds).order("created_at"),
      supabase.from("reflection_reactions").select("reflection_id, type").in("reflection_id", reflectionIds),
      supabase.from("reflection_reactions").select("reflection_id, type").in("reflection_id", reflectionIds).eq("user_id", user.id),
    ]);

    for (const c of (commentsResult.data ?? []) as unknown as { id: string; reflection_id: string; content: string; created_at: string; user_id: string; parent_id: string | null; profiles: { name: string } }[]) {
      if (!commentsMap[c.reflection_id]) commentsMap[c.reflection_id] = [];
      commentsMap[c.reflection_id].push({ id: c.id, content: c.content, created_at: c.created_at, user_id: c.user_id, parent_id: c.parent_id, profiles: c.profiles });
    }
    for (const r of (reactionsResult.data ?? []) as { reflection_id: string; type: string }[]) {
      if (!reactionsMap[r.reflection_id]) reactionsMap[r.reflection_id] = {};
      reactionsMap[r.reflection_id][r.type] = (reactionsMap[r.reflection_id][r.type] ?? 0) + 1;
    }
    for (const r of (myReactionsResult.data ?? []) as { reflection_id: string; type: string }[]) {
      myReactionMap[r.reflection_id] = r.type;
    }
  }

  const feed = reflections.map((r) => ({
    id: r.id, day: r.day, year: r.year, content: r.content,
    created_at: r.created_at,
    authorName: r.profiles?.name ?? "이름 없음",
    authorId: r.user_id,
    avatarUrl: r.profiles?.avatar_url ?? null,
    comments: commentsMap[r.id] ?? [],
    reactions: reactionsMap[r.id] ?? {},
    myReaction: myReactionMap[r.id] ?? null,
  }));

  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();

  return {
    feed,
    groupName: groupResult.data.name,
    currentUserId: user.id,
    currentUserName: profile?.name ?? "이름 없음",
    isLeader: membership.role === "leader",
    inviteCode: inviteResult.data?.code ?? null,
  };
}

// 그룹 멤버 출석/묵상 상태 조회 (폴링용)
export async function getGroupMemberStatus(groupId: string, viewDay?: number) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인 필요" };

  const seoulDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const [yearNum, monthNum, dayNum] = seoulDateStr.split("-").map(Number);
  const year = yearNum;
  const seoulDate = new Date(yearNum, monthNum - 1, dayNum);
  const yearStart = new Date(yearNum, 0, 0);
  const todayDay = Math.floor((seoulDate.getTime() - yearStart.getTime()) / 86400000);
  const queryDay = viewDay ?? todayDay;

  const { data: allMembers } = await supabase
    .from("group_members")
    .select("user_id, role, profiles:user_id (name, avatar_url)")
    .eq("group_id", groupId);

  const rows = (allMembers ?? []) as unknown as { user_id: string; role: string; profiles: { name: string; avatar_url: string | null } }[];
  const userIds = rows.map((m) => m.user_id);

  if (userIds.length === 0) return { members: [], todayDay, queryDay };

  const [{ data: checks }, { data: reflections }, { data: latestChecks }] = await Promise.all([
    supabase.from("bible_checks").select("user_id").in("user_id", userIds).eq("day", queryDay).eq("year", year),
    supabase.from("reflection_group_shares").select("reflection:reflections!inner(user_id)").eq("group_id", groupId).eq("reflection.day", queryDay).eq("reflection.year", year),
    supabase.from("bible_checks").select("user_id, day").in("user_id", userIds).eq("year", year).order("day", { ascending: false }),
  ]);

  const checkedSet = new Set((checks ?? []).map((c: { user_id: string }) => c.user_id));
  const reflectionSet = new Set((reflections ?? []).map((r: { reflection: { user_id: string } }) => r.reflection.user_id));

  // 각 유저의 최근 체크 day + 총 체크 수
  const latestCheckMap = new Map<string, number>();
  const checkCountMap = new Map<string, number>();
  for (const c of (latestChecks ?? []) as { user_id: string; day: number }[]) {
    if (!latestCheckMap.has(c.user_id)) latestCheckMap.set(c.user_id, c.day);
    checkCountMap.set(c.user_id, (checkCountMap.get(c.user_id) ?? 0) + 1);
  }

  return {
    todayDay,
    queryDay,
    members: rows.map((m) => ({
      userId: m.user_id,
      name: m.profiles?.name ?? "이름 없음",
      avatarUrl: m.profiles?.avatar_url ?? null,
      role: m.role,
      checkedToday: checkedSet.has(m.user_id),
      hasReflection: reflectionSet.has(m.user_id),
      lastCheckedDay: latestCheckMap.get(m.user_id) ?? null,
      totalChecked: checkCountMap.get(m.user_id) ?? 0,
    })),
  };
}
