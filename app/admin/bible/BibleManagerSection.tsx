"use client";

import { useState, useTransition } from "react";
import { addBibleManager, removeBibleManager } from "./actions";

type UserOption = { id: string; name: string };
type Manager = { userId: string; name: string };

export default function BibleManagerSection({
  managers: initialManagers,
  allUsers,
}: {
  managers: Manager[];
  allUsers: UserOption[];
}) {
  const [managers, setManagers] = useState(initialManagers);
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  const managerIds = new Set(managers.map((m) => m.userId));
  const available = allUsers.filter((u) => !managerIds.has(u.id));
  const filtered = query.trim()
    ? available.filter((u) => u.name.includes(query.trim()))
    : [];

  function handleAdd(userId: string) {
    const userName = allUsers.find((u) => u.id === userId)?.name ?? "이름 없음";
    setManagers((prev) => [...prev, { userId, name: userName }]);
    setQuery("");
    startTransition(async () => {
      await addBibleManager(userId);
    });
  }

  function handleRemove(userId: string) {
    setManagers((prev) => prev.filter((m) => m.userId !== userId));
    startTransition(async () => {
      await removeBibleManager(userId);
    });
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-neutral-800">매니저 관리</h3>
          <p className="mt-0.5 text-sm text-neutral-400">
            전체 그룹 현황을 조회할 수 있는 매니저를 지정합니다
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-4">
        {/* 검색 */}
        <div className="relative w-56">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 검색하여 추가..."
            className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs outline-none focus:border-navy/30"
          />
          {filtered.length > 0 && (
            <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
              {filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleAdd(u.id)}
                  className="flex w-full items-center justify-between px-2.5 py-1.5 text-left hover:bg-neutral-50"
                >
                  <span className="text-xs text-neutral-700">{u.name}</span>
                  <span className="text-[11px] text-navy font-medium">추가</span>
                </button>
              ))}
            </div>
          )}
          {query.trim() && filtered.length === 0 && (
            <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 shadow-lg">
              <span className="text-xs text-neutral-400">검색 결과 없음</span>
            </div>
          )}
        </div>

        {/* 현재 매니저 목록 */}
        <div className="flex flex-1 flex-wrap gap-2">
          {managers.length === 0 ? (
            <span className="text-xs text-neutral-400">지정된 매니저가 없습니다</span>
          ) : (
            managers.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-1.5 rounded-full bg-navy/10 py-1 pl-3 pr-1.5 text-xs text-navy"
              >
                <span className="font-medium">{m.name}</span>
                <button
                  onClick={() => handleRemove(m.userId)}
                  className="ml-0.5 rounded-full p-0.5 text-neutral-300 hover:bg-red-50 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
