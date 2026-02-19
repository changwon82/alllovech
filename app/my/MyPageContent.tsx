"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateProfile } from "./actions";

type ReflectionSummary = {
  id: string;
  day: number;
  content: string;
  visibility: string;
  created_at: string;
};

// 연간 달력 히트맵에 사용할 날짜 정보 계산
function getDayDate(year: number, dayOfYear: number): Date {
  const yearStart = new Date(year, 0, 1);
  return new Date(yearStart.getTime() + (dayOfYear - 1) * 86400000);
}

function getMonthLabel(month: number): string {
  return ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"][month];
}

export default function MyPageContent({
  name: initialName,
  status,
  phone: initialPhone,
  year,
  today,
  checkedDays,
  reflections,
}: {
  name: string;
  status: string;
  phone: string | null;
  year: number;
  today: number;
  checkedDays: number[];
  reflections: ReflectionSummary[];
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(initialName);
  const [editPhone, setEditPhone] = useState(initialPhone ?? "");
  const [isPending, startTransition] = useTransition();

  const checkedSet = new Set(checkedDays);
  const reflectionDays = new Set(reflections.map((r) => r.day));
  const totalChecked = checkedDays.length;
  const percentage = today > 0 ? Math.round((totalChecked / today) * 100) : 0;

  function handleSaveProfile() {
    if (!editName.trim()) return;
    startTransition(async () => {
      const result = await updateProfile(editName.trim(), editPhone.trim());
      if ("success" in result) {
        setName(editName.trim());
        setPhone(editPhone.trim());
        setIsEditing(false);
      }
    });
  }

  // 12개월로 그룹핑
  const months: { month: number; days: { day: number; checked: boolean; hasReflection: boolean; isToday: boolean; isFuture: boolean }[] }[] = [];
  let currentMonth = -1;

  for (let d = 1; d <= 365; d++) {
    const date = getDayDate(year, d);
    const m = date.getMonth();
    if (m !== currentMonth) {
      months.push({ month: m, days: [] });
      currentMonth = m;
    }
    months[months.length - 1].days.push({
      day: d,
      checked: checkedSet.has(d),
      hasReflection: reflectionDays.has(d),
      isToday: d === today,
      isFuture: d > today,
    });
  }

  return (
    <>
      {/* 승인 대기 안내 */}
      {status === "pending" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          관리자 승인 대기 중입니다. 승인 후 읽기 체크와 묵상 기록이 가능합니다.
        </div>
      )}

      {/* 프로필 요약 */}
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        {isEditing ? (
          <div className="space-y-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="이름"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            />
            <input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="전화번호 (선택)"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setIsEditing(false); setEditName(name); setEditPhone(phone); }}
                className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
              >
                취소
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isPending || !editName.trim()}
                className="rounded-lg bg-navy px-4 py-1.5 text-xs font-medium text-white hover:bg-navy/90 disabled:opacity-50"
              >
                {isPending ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-neutral-800">{name}</p>
              {phone && <p className="mt-0.5 text-xs text-neutral-400">{phone}</p>}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-neutral-400 hover:text-navy"
            >
              수정
            </button>
          </div>
        )}
        <div className="mt-3 flex gap-6">
          <div>
            <p className="text-2xl font-bold text-blue">{totalChecked}</p>
            <p className="text-xs text-neutral-500">읽은 일수</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-navy">{percentage}%</p>
            <p className="text-xs text-neutral-500">달성률 (오늘까지)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-700">{reflections.length}</p>
            <p className="text-xs text-neutral-500">묵상</p>
          </div>
        </div>
      </div>

      {/* 연간 캘린더 히트맵 */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy">{year}년 읽기 현황</h2>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-[10px] w-[10px] rounded-sm bg-neutral-200" /> 미읽음
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-[10px] w-[10px] rounded-sm bg-blue/60" /> 읽음
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-[10px] w-[10px] rounded-sm bg-blue" /> 읽음+묵상
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {months.map(({ month, days }) => (
            <div key={month}>
              <p className="mb-1 text-xs font-medium text-neutral-500">{getMonthLabel(month)}</p>
              <div className="flex flex-wrap gap-[3px]">
                {days.map((d) => (
                  <Link
                    key={d.day}
                    href={`/365bible?day=${d.day}`}
                    title={`Day ${d.day}${d.checked ? " (읽음)" : ""}${d.hasReflection ? " (묵상)" : ""}`}
                    className={`h-[14px] w-[14px] rounded-sm transition-colors ${
                      d.isToday
                        ? "ring-2 ring-blue ring-offset-1"
                        : ""
                    } ${
                      d.isFuture
                        ? "bg-neutral-100"
                        : d.checked
                          ? d.hasReflection
                            ? "bg-blue"
                            : "bg-blue/60"
                          : "bg-neutral-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 묵상 목록 */}
      <section className="mt-10">
        <h2 className="mb-4 text-sm font-bold text-navy">묵상 기록</h2>
        {reflections.length === 0 ? (
          <p className="rounded-xl border border-neutral-200 p-6 text-center text-sm text-neutral-400">
            아직 작성한 묵상이 없습니다
          </p>
        ) : (
          <div className="space-y-3">
            {reflections.map((r) => (
              <Link
                key={r.id}
                href={`/365bible?day=${r.day}`}
                className="block rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue">Day {r.day}</span>
                  <span className="text-xs text-neutral-400">
                    {r.visibility === "private" ? "나만 보기" : r.visibility === "public" ? "공개" : "소그룹"}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-700">
                  {r.content}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
