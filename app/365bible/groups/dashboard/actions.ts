"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBibleManager } from "@/lib/admin";

type PeriodStats = { checked: number; total: number; rate: number };
type GroupDashboardData = {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  today: PeriodStats;
  weekly: PeriodStats;
  monthly: PeriodStats;
  yearly: PeriodStats;
};
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

  // 연간 전체 체크 데이터 1회 쿼리
  let checkRows: { user_id: string; day: number }[] = [];
  if (allUserIds.length > 0) {
    const { data: checks } = await admin
      .from("bible_checks")
      .select("user_id, day")
      .in("user_id", allUserIds)
      .eq("year", year)
      .gte("day", 1)
      .lte("day", todayDay);
    checkRows = (checks ?? []) as { user_id: string; day: number }[];
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

    return {
      id: g.id,
      name: g.name,
      type: g.type,
      memberCount: mc,
      today: calcStats(todayChecked, mc),
      weekly: calcStats(weekChecked, mc * weekDays),
      monthly: calcStats(monthChecked, mc * monthDays),
      yearly: calcStats(yearChecked, mc * todayDay),
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
  };
}
