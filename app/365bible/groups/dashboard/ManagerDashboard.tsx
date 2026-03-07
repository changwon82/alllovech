"use client";

import { useState } from "react";
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

export default function ManagerDashboard({ initialData }: { initialData: DashboardOverview }) {
  const { overall, todayDay, totalGroups, totalMembers, groups, topReflections, groupActivity } = initialData;
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <div className="mt-4 space-y-4">
      {/* 상단 기간 요약 카드 */}
      <div className="grid grid-cols-4 gap-2">
        {PERIODS.map(({ key, label }) => {
          const stats = overall[key];
          const isToday = key === "today";
          return (
            <div
              key={key}
              className={`rounded-2xl p-4 shadow-sm ${isToday ? "bg-accent-light" : "bg-white"}`}
            >
              <p className="text-xs font-medium text-neutral-500">{label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`text-2xl font-black ${isToday ? "text-accent" : "text-navy"}`}>
                  {stats.rate}%
                </span>
                <span className="text-[10px] text-neutral-400">
                  {stats.checked}/{stats.total}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 정보 라인 */}
      <p className="text-center text-sm text-neutral-500">
        Day {todayDay} · {totalGroups}개 그룹 · {totalMembers}명
      </p>

      {/* 그룹별 리스트 */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {groups.map((g, i) => {
          const isExpanded = expandedGroup === g.id;
          return (
            <div key={g.id} className={i > 0 ? "border-t border-neutral-100" : ""}>
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : g.id)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50"
              >
                {/* 그룹 정보 */}
                <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                  <Badge variant="default">{TYPE_LABEL[g.type] ?? g.type}</Badge>
                  <span className="text-xs font-bold text-neutral-800">{g.name}</span>
                  <span className="text-[10px] text-neutral-400">{g.memberCount}명</span>
                </div>

                {/* 4기간 통계 */}
                <div className="grid flex-1 grid-cols-4 gap-1">
                  {PERIODS.map(({ key, label }) => {
                    const stats: PeriodStats = g[key];
                    return (
                      <div key={key} className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                        <span className="text-[10px] text-neutral-400">{label}</span>
                        <span className={`text-xs font-bold ${rateColor(stats.rate)}`}>
                          {stats.rate}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`shrink-0 text-neutral-300 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              {/* 멤버 상세 */}
              {isExpanded && g.members.length > 0 && (
                <div className="border-t border-neutral-50 bg-neutral-50/50 px-3 py-1">
                  {g.members
                    .sort((a, b) => b.yearlyRate - a.yearlyRate)
                    .map((m) => (
                      <div key={m.userId} className="flex items-center gap-2 py-1.5">
                        <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                          <span className="text-xs font-medium text-neutral-700">{m.name}</span>
                          <span className="text-[10px] text-neutral-400">
                            <strong className="text-neutral-500">Day {m.lastDay || 0}</strong>까지
                          </span>
                        </div>
                        <div className="grid flex-1 grid-cols-4 gap-1">
                          <div className="flex items-center justify-center">
                            <span className={`text-xs font-bold ${m.todayChecked ? "text-green-600" : "text-neutral-300"}`}>
                              {m.todayChecked ? "✓" : "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className={`text-xs font-bold ${rateColor(m.weeklyRate)}`}>{m.weeklyRate}%</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className={`text-xs font-bold ${rateColor(m.monthlyRate)}`}>{m.monthlyRate}%</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className={`text-xs font-bold ${rateColor(m.yearlyRate)}`}>{m.yearlyRate}%</span>
                          </div>
                        </div>
                        <div className="w-4 shrink-0" />
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 묵상 랭킹 */}
      {topReflections.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-neutral-100">
            <span className="text-xs font-bold text-navy">묵상 TOP 10</span>
          </div>
          <div className="flex gap-4 px-4 py-2">
            {(() => {
              // 동점 순위 계산
              const ranked = topReflections.map((r, i) => ({
                ...r,
                rank: i === 0 || r.count !== topReflections[i - 1].count
                  ? i + 1
                  : (topReflections.findIndex((t) => t.count === r.count) + 1),
              }));
              const half = Math.ceil(ranked.length / 2);
              const left = ranked.slice(0, half);
              const right = ranked.slice(half);
              return [left, right].map((col, ci) => (
                <div key={ci} className="flex-1">
                  {col.map((r) => (
                    <div key={r.name} className="flex items-center gap-2 py-1.5">
                      <span className={`w-5 text-center text-xs font-bold ${r.rank <= 3 ? "text-accent" : "text-neutral-400"}`}>{r.rank}</span>
                      <span className="flex-1 truncate text-xs font-medium text-neutral-700">{r.name}</span>
                      <span className="text-xs font-bold text-navy">{r.count}<span className="font-normal text-neutral-400">편</span></span>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* 소통 활발 방 랭킹 */}
      {groupActivity.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-neutral-100">
            <span className="text-xs font-bold text-navy">소통 활발 방</span>
          </div>
          <div className="px-4 py-2">
            {groupActivity.map((g, i) => (
              <div key={g.name} className="flex items-center gap-2 py-1.5">
                <span className={`w-5 text-center text-xs font-bold ${i < 3 ? "text-accent" : "text-neutral-400"}`}>{i + 1}</span>
                <span className="flex-1 truncate text-xs font-medium text-neutral-700">{g.name}</span>
                <span className="text-[10px] text-neutral-400">묵상공유{g.shares} 댓글{g.comments} 공감{g.reactions}</span>
                <span className="text-xs font-bold text-navy">{g.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
