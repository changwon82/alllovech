"use client";

import { useState } from "react";

type UserStat = { id: string; name: string; checkedCount: number; percentage: number };
type GroupStat = { id: string; name: string; memberCount: number; avgPercentage: number };

export default function ReadingStats({
  users,
  groups,
  today,
  year,
}: {
  users: UserStat[];
  groups: GroupStat[];
  today: number;
  year: number;
}) {
  const [tab, setTab] = useState<"users" | "groups">("users");
  const [sortBy, setSortBy] = useState<"name" | "percentage">("percentage");

  const sortedUsers = [...users].sort((a, b) =>
    sortBy === "percentage" ? b.percentage - a.percentage : a.name.localeCompare(b.name)
  );

  const sortedGroups = [...groups].sort((a, b) => b.avgPercentage - a.avgPercentage);

  const totalUsers = users.length;
  const avgPercentage = totalUsers > 0
    ? Math.round(users.reduce((sum, u) => sum + u.percentage, 0) / totalUsers)
    : 0;

  return (
    <div>
      {/* 요약 */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-2xl font-bold text-navy">{year}년</p>
          <p className="text-xs text-neutral-500">Day {today} / 365</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-2xl font-bold text-blue">{avgPercentage}%</p>
          <p className="text-xs text-neutral-500">평균 달성률</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-2xl font-bold text-neutral-800">{totalUsers}명</p>
          <p className="text-xs text-neutral-500">활성 사용자</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("users")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            tab === "users" ? "bg-navy text-white" : "border border-neutral-200 text-neutral-500"
          }`}
        >
          개인별
        </button>
        <button
          onClick={() => setTab("groups")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            tab === "groups" ? "bg-navy text-white" : "border border-neutral-200 text-neutral-500"
          }`}
        >
          그룹별
        </button>
      </div>

      {tab === "users" && (
        <>
          <div className="mb-2 flex justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "percentage")}
              className="rounded-lg border border-neutral-200 px-2 py-1 text-xs outline-none"
            >
              <option value="percentage">달성률순</option>
              <option value="name">이름순</option>
            </select>
          </div>
          <div className="space-y-1">
            {sortedUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg border border-neutral-100 px-3 py-2">
                <span className="w-20 shrink-0 text-sm font-medium text-neutral-700">{u.name}</span>
                <div className="min-w-0 flex-1">
                  <div className="h-2 rounded-full bg-neutral-100">
                    <div
                      className="h-2 rounded-full bg-blue transition-all"
                      style={{ width: `${Math.min(100, u.percentage)}%` }}
                    />
                  </div>
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-neutral-500">
                  {u.checkedCount}/{today} ({u.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "groups" && (
        <div className="space-y-2">
          {sortedGroups.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">그룹이 없습니다</p>
          ) : (
            sortedGroups.map((g) => (
              <div key={g.id} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neutral-800">{g.name}</h3>
                  <span className="text-xs text-neutral-400">{g.memberCount}명</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="h-3 rounded-full bg-neutral-100">
                      <div
                        className="h-3 rounded-full bg-blue transition-all"
                        style={{ width: `${Math.min(100, g.avgPercentage)}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-navy">{g.avgPercentage}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
