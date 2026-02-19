import { requireAdmin } from "@/lib/admin";
import ReadingStats from "./ReadingStats";

export const metadata = { title: "읽기 현황 | 다애교회" };

function getKoreaYear(): number {
  return Number(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }).split("-")[0]);
}

function getKoreaDayOfYear(): number {
  const seoulDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const [year, month, day] = seoulDateStr.split("-").map(Number);
  const seoulDate = new Date(year, month - 1, day);
  const yearStart = new Date(year, 0, 0);
  return Math.floor((seoulDate.getTime() - yearStart.getTime()) / 86400000);
}

export default async function ReadingsPage() {
  const { supabase } = await requireAdmin();

  const year = getKoreaYear();
  const today = Math.max(1, Math.min(365, getKoreaDayOfYear()));

  // 모든 활성 사용자
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  // 올해 전체 체크 데이터
  const { data: allChecks } = await supabase
    .from("bible_checks")
    .select("user_id, day")
    .eq("year", year);

  // 그룹별 정리
  const { data: groupsData } = await supabase
    .from("groups")
    .select("id, name")
    .eq("is_active", true);

  const { data: membersData } = await supabase
    .from("group_members")
    .select("group_id, user_id");

  // 사용자별 체크 수
  const checksPerUser: Record<string, number> = {};
  for (const c of (allChecks ?? []) as { user_id: string; day: number }[]) {
    checksPerUser[c.user_id] = (checksPerUser[c.user_id] ?? 0) + 1;
  }

  const users = (profiles ?? []).map((p: { id: string; name: string }) => ({
    id: p.id,
    name: p.name,
    checkedCount: checksPerUser[p.id] ?? 0,
    percentage: today > 0 ? Math.round(((checksPerUser[p.id] ?? 0) / today) * 100) : 0,
  }));

  // 그룹별 통계
  const membersByGroup: Record<string, string[]> = {};
  for (const m of (membersData ?? []) as { group_id: string; user_id: string }[]) {
    if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
    membersByGroup[m.group_id].push(m.user_id);
  }

  const groups = (groupsData ?? []).map((g: { id: string; name: string }) => {
    const memberIds = membersByGroup[g.id] ?? [];
    const totalChecks = memberIds.reduce((sum, uid) => sum + (checksPerUser[uid] ?? 0), 0);
    const avgPercentage = memberIds.length > 0 && today > 0
      ? Math.round((totalChecks / (memberIds.length * today)) * 100)
      : 0;
    return { id: g.id, name: g.name, memberCount: memberIds.length, avgPercentage };
  });

  return <ReadingStats users={users} groups={groups} today={today} year={year} />;
}
