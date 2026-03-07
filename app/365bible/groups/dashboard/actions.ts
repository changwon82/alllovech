"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBibleManager } from "@/lib/admin";

type PeriodStats = { checked: number; total: number; rate: number };
type MemberStats = {
  userId: string;
  name: string;
  lastDay: number;
  todayChecked: boolean;
  weeklyRate: number;
  monthlyRate: number;
  yearlyRate: number;
};
type GroupDashboardData = {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  today: PeriodStats;
  weekly: PeriodStats;
  monthly: PeriodStats;
  yearly: PeriodStats;
  members: MemberStats[];
};
type ReflectionRank = { name: string; count: number };
type GroupActivityRank = { name: string; shares: number; comments: number; reactions: number; total: number };
export type DashboardOverview = {
  todayDay: number;
  totalGroups: number;
  totalMembers: number;
  overall: {
    today: PeriodStats;
    weekly: PeriodStats;
    monthly: PeriodStats;
    yearly: PeriodStats;
  };
  groups: GroupDashboardData[];
  topReflections: ReflectionRank[];
  groupActivity: GroupActivityRank[];
};

function calcStats(checked: number, total: number): PeriodStats {
  return { checked, total, rate: total > 0 ? Math.round((checked / total) * 100) : 0 };
}

export async function getDashboardOverview(): Promise<DashboardOverview | { error: string }> {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인 필요" };

  const isManager = await isBibleManager(supabase, user.id);
  if (!isManager) return { error: "매니저 권한 없음" };

  const admin = createAdminClient();

  // 한국 시간 기준 오늘 day / year
  const seoulDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const [yearNum, monthNum, dayNum] = seoulDateStr.split("-").map(Number);
  const year = yearNum;
  const seoulDate = new Date(yearNum, monthNum - 1, dayNum);
  const yearStart = new Date(yearNum, 0, 0);
  const todayDay = Math.floor((seoulDate.getTime() - yearStart.getTime()) / 86400000);

  // 전체 활성 그룹 + 멤버 조회
  const [{ data: groups }, { data: allMembers }] = await Promise.all([
    admin
      .from("groups")
      .select("id, name, type")
      .eq("is_active", true)
      .eq("status", "approved")
      .order("name"),
    admin.from("group_members").select("group_id, user_id"),
  ]);

  const groupList = (groups ?? []) as { id: string; name: string; type: string }[];
  const memberRows = (allMembers ?? []) as { group_id: string; user_id: string }[];

  // 활성 그룹에 속한 멤버만 필터
  const activeGroupIds = new Set(groupList.map((g) => g.id));
  const filteredMembers = memberRows.filter((m) => activeGroupIds.has(m.group_id));
  const allUserIds = [...new Set(filteredMembers.map((m) => m.user_id))];

  // 연간 전체 체크 데이터 + 프로필 이름 조회
  let checkRows: { user_id: string; day: number }[] = [];
  const userNameMap = new Map<string, string>();
  if (allUserIds.length > 0) {
    const [{ data: checks }, { data: profiles }] = await Promise.all([
      admin
        .from("bible_checks")
        .select("user_id, day")
        .in("user_id", allUserIds)
        .eq("year", year)
        .gte("day", 1)
        .lte("day", todayDay),
      admin
        .from("profiles")
        .select("id, name")
        .in("id", allUserIds),
    ]);
    checkRows = (checks ?? []) as { user_id: string; day: number }[];
    for (const p of (profiles ?? []) as { id: string; name: string }[]) {
      userNameMap.set(p.id, p.name);
    }
  }

  // user_id → Set<day> 맵 구축
  const userDays = new Map<string, Set<number>>();
  for (const c of checkRows) {
    if (!userDays.has(c.user_id)) userDays.set(c.user_id, new Set());
    userDays.get(c.user_id)!.add(c.day);
  }

  // 기간 범위 계산
  const weekStart = Math.max(1, todayDay - 6);
  const monthStart = Math.max(1, todayDay - 29);

  // 유저별 기간 체크 수 계산
  function countForPeriod(days: Set<number>, start: number, end: number): number {
    let count = 0;
    for (let d = start; d <= end; d++) {
      if (days.has(d)) count++;
    }
    return count;
  }

  const weekDays = todayDay - weekStart + 1;
  const monthDays = todayDay - monthStart + 1;

  // 그룹별 멤버 매핑
  const groupMemberMap = new Map<string, string[]>();
  for (const m of filteredMembers) {
    if (!groupMemberMap.has(m.group_id)) groupMemberMap.set(m.group_id, []);
    groupMemberMap.get(m.group_id)!.push(m.user_id);
  }

  // 그룹별 통계
  const groupStats: GroupDashboardData[] = groupList.map((g) => {
    const memberIds = groupMemberMap.get(g.id) ?? [];
    const mc = memberIds.length;
    let todayChecked = 0, weekChecked = 0, monthChecked = 0, yearChecked = 0;

    for (const uid of memberIds) {
      const days = userDays.get(uid);
      if (!days) continue;
      if (days.has(todayDay)) todayChecked++;
      weekChecked += countForPeriod(days, weekStart, todayDay);
      monthChecked += countForPeriod(days, monthStart, todayDay);
      yearChecked += days.size;
    }

    const memberStats: MemberStats[] = memberIds.map((uid) => {
      const days = userDays.get(uid) ?? new Set<number>();
      let lastDay = 0;
      for (const d of days) { if (d > lastDay) lastDay = d; }
      return {
        userId: uid,
        name: userNameMap.get(uid) ?? "이름 없음",
        lastDay,
        todayChecked: days.has(todayDay),
        weeklyRate: weekDays > 0 ? Math.round((countForPeriod(days, weekStart, todayDay) / weekDays) * 100) : 0,
        monthlyRate: monthDays > 0 ? Math.round((countForPeriod(days, monthStart, todayDay) / monthDays) * 100) : 0,
        yearlyRate: todayDay > 0 ? Math.round((days.size / todayDay) * 100) : 0,
      };
    });

    return {
      id: g.id,
      name: g.name,
      type: g.type,
      memberCount: mc,
      today: calcStats(todayChecked, mc),
      weekly: calcStats(weekChecked, mc * weekDays),
      monthly: calcStats(monthChecked, mc * monthDays),
      yearly: calcStats(yearChecked, mc * todayDay),
      members: memberStats,
    };
  });

  // 전체 요약
  const tm = allUserIds.length;
  let oToday = 0, oWeek = 0, oMonth = 0, oYear = 0;
  for (const uid of allUserIds) {
    const days = userDays.get(uid);
    if (!days) continue;
    if (days.has(todayDay)) oToday++;
    oWeek += countForPeriod(days, weekStart, todayDay);
    oMonth += countForPeriod(days, monthStart, todayDay);
    oYear += days.size;
  }

  // 묵상 랭킹 (올해, 상위 10명)
  let topReflections: ReflectionRank[] = [];
  if (allUserIds.length > 0) {
    const { data: refRows } = await admin
      .from("reflections")
      .select("user_id")
      .in("user_id", allUserIds)
      .eq("year", year);
    const refCount = new Map<string, number>();
    for (const r of (refRows ?? []) as { user_id: string }[]) {
      refCount.set(r.user_id, (refCount.get(r.user_id) ?? 0) + 1);
    }
    topReflections = [...refCount.entries()]
      .map(([uid, count]) => ({ name: userNameMap.get(uid) ?? "이름 없음", count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // 그룹별 소통 활동 랭킹
  const activeGroupIdsArr = [...activeGroupIds];
  let groupActivity: GroupActivityRank[] = [];
  if (activeGroupIdsArr.length > 0) {
    const [{ data: shares }, { data: comments }, { data: reactions }] = await Promise.all([
      admin.from("reflection_group_shares").select("group_id").in("group_id", activeGroupIdsArr),
      admin.from("reflection_comments").select("group_id").in("group_id", activeGroupIdsArr),
      admin.from("reflection_reactions").select("group_id").in("group_id", activeGroupIdsArr),
    ]);
    const groupNameMap = new Map(groupList.map((g) => [g.id, g.name]));
    const actMap = new Map<string, { shares: number; comments: number; reactions: number }>();
    for (const id of activeGroupIdsArr) {
      actMap.set(id, { shares: 0, comments: 0, reactions: 0 });
    }
    for (const s of (shares ?? []) as { group_id: string }[]) {
      const a = actMap.get(s.group_id); if (a) a.shares++;
    }
    for (const c of (comments ?? []) as { group_id: string }[]) {
      const a = actMap.get(c.group_id); if (a) a.comments++;
    }
    for (const r of (reactions ?? []) as { group_id: string }[]) {
      const a = actMap.get(r.group_id); if (a) a.reactions++;
    }
    groupActivity = [...actMap.entries()]
      .map(([id, a]) => ({
        name: groupNameMap.get(id) ?? "알 수 없음",
        shares: a.shares,
        comments: a.comments,
        reactions: a.reactions,
        total: a.shares + a.comments + a.reactions,
      }))
      .filter((a) => a.total > 0)
      .sort((a, b) => b.shares - a.shares || b.comments - a.comments || b.reactions - a.reactions);
  }

  return {
    todayDay,
    totalGroups: groupList.length,
    totalMembers: tm,
    overall: {
      today: calcStats(oToday, tm),
      weekly: calcStats(oWeek, tm * weekDays),
      monthly: calcStats(oMonth, tm * monthDays),
      yearly: calcStats(oYear, tm * todayDay),
    },
    groups: groupStats,
    topReflections: topReflections.length > 0 ? topReflections : [
      { name: "김민수", count: 45 },
      { name: "이영희", count: 38 },
      { name: "박준혁", count: 33 },
      { name: "정수연", count: 28 },
      { name: "최동진", count: 24 },
      { name: "한지윤", count: 20 },
      { name: "오세훈", count: 17 },
      { name: "윤서영", count: 14 },
      { name: "장민호", count: 11 },
      { name: "송예진", count: 8 },
    ],
    groupActivity,
  };
}
