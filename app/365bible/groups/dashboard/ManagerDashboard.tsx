"use client";

import Badge from "@/app/components/ui/Badge";
import type { DashboardOverview } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  dakobang: "다코방",
  family: "가족",
  free: "자유",
};

type PeriodStats = { checked: number; total: number; rate: number };

const PERIODS = [
  { key: "today" as const, label: "오늘" },
  { key: "weekly" as const, label: "주간" },
  { key: "monthly" as const, label: "월간" },
  { key: "yearly" as const, label: "연간" },
];

function rateColor(rate: number) {
  if (rate >= 80) return "text-green-600";
  if (rate >= 50) return "text-amber-500";
  return "text-neutral-400";
}

function barColor(rate: number) {
  if (rate >= 80) return "bg-green-500";
  if (rate >= 50) return "bg-amber-400";
  return "bg-neutral-300";
}

export default function ManagerDashboard({ initialData }: { initialData: DashboardOverview }) {
  const { overall, todayDay, totalGroups, totalMembers, groups } = initialData;

  return (
    <div className="mt-4 space-y-4">
      {/* 상단 2x2 기간 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {PERIODS.map(({ key, label }) => {
          const stats = overall[key];
          const isToday = key === "today";
          return (
            <div
              key={key}
              className={`rounded-2xl p-4 shadow-sm ${isToday ? "bg-accent-light" : "bg-white"}`}
            >
              <p className="text-xs font-medium text-neutral-500">{label}</p>
              <p className={`mt-1 text-3xl font-black ${isToday ? "text-accent" : "text-navy"}`}>
                {stats.rate}%
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {stats.checked}/{stats.total}
              </p>
            </div>
          );
        })}
      </div>

      {/* 정보 라인 */}
      <p className="text-center text-sm text-neutral-500">
        Day {todayDay} · {totalGroups}개 그룹 · {totalMembers}명
      </p>

      {/* 그룹별 카드 */}
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.id} className="rounded-2xl bg-white p-4 shadow-sm">
            {/* 헤더 */}
            <div className="flex items-center gap-1.5">
              <Badge variant="default">{TYPE_LABEL[g.type] ?? g.type}</Badge>
              <h3 className="text-sm font-bold text-neutral-800">{g.name}</h3>
              <span className="text-xs text-neutral-400">{g.memberCount}명</span>
            </div>

            {/* 4기간 미니 통계 */}
            <div className="mt-3 grid grid-cols-4 gap-2">
              {PERIODS.map(({ key, label }) => {
                const stats: PeriodStats = g[key];
                return (
                  <div key={key}>
                    <p className="text-xs text-neutral-400">{label}</p>
                    <p className={`text-sm font-bold ${rateColor(stats.rate)}`}>
                      {stats.rate}%
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(stats.rate)}`}
                        style={{ width: `${stats.rate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
