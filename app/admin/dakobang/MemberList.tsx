"use client";

import { useState, useTransition } from "react";
import {
  bulkCreateChurchMembers,
  deleteChurchMember,
  deleteAllChurchMembers,
} from "./actions";

interface ChurchMember {
  id: string;
  name: string;
}

interface Props {
  initialMembers: ChurchMember[];
  onMembersChange?: (members: ChurchMember[]) => void;
}

export default function MemberList({ initialMembers, onMembersChange }: Props) {
  const [members, setMembers] = useState(initialMembers);

  function updateMembers(next: ChurchMember[]) {
    setMembers(next);
    onMembersChange?.(next);
  }
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = search
    ? members.filter((m) => m.name.includes(search))
    : members;

  function handleBulkAdd() {
    // 줄바꿈, 쉼표, 공백으로 분리
    const names = input
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!names.length) return;

    startTransition(async () => {
      const res = await bulkCreateChurchMembers(names);
      if (res.error) {
        alert("등록 실패: " + res.error);
      } else if (res.data) {
        const next = [...members, ...(res.data as ChurchMember[])];
        updateMembers(next);
        setInput("");
      }
    });
  }

  function handleDelete(id: string) {
    const prev = members.find((m) => m.id === id);
    updateMembers(members.filter((m) => m.id !== id));

    startTransition(async () => {
      const res = await deleteChurchMember(id);
      if (res.error) {
        alert("삭제 실패: " + res.error);
        if (prev) updateMembers([...members, prev]);
      }
    });
  }

  function handleDeleteAll() {
    if (!confirm("성도명단 전체를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;

    const prev = [...members];
    updateMembers([]);

    startTransition(async () => {
      const res = await deleteAllChurchMembers();
      if (res.error) {
        alert("전체 삭제 실패: " + res.error);
        updateMembers(prev);
      }
    });
  }

  return (
    <div>
      {/* 입력 영역 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="mb-2 text-sm font-medium text-neutral-600">
          이름을 한꺼번에 입력하세요 (쉼표 또는 줄바꿈으로 구분)
        </p>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"홍길동, 김철수, 이영희\n또는 줄바꿈으로 구분"}
          rows={4}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-navy focus:outline-none"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleBulkAdd}
            disabled={isPending || !input.trim()}
            className="rounded-xl bg-navy px-5 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            등록
          </button>
          {isPending && <span className="text-xs text-neutral-400">처리 중...</span>}
        </div>
      </div>

      {/* 명단 */}
      {members.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-700">
                등록된 성도 {members.length}명
              </span>
              <input
                type="text"
                placeholder="이름 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs focus:border-navy focus:outline-none"
              />
            </div>
            <button
              onClick={handleDeleteAll}
              disabled={isPending}
              className="rounded px-2 py-1 text-xs text-red-400 transition-all hover:bg-red-50 active:scale-95"
            >
              전체 삭제
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filtered.map((m) => (
              <span
                key={m.id}
                className="group inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-sm text-neutral-700"
              >
                {m.name}
                <button
                  onClick={() => handleDelete(m.id)}
                  className="hidden text-neutral-400 transition-colors hover:text-red-400 group-hover:inline"
                  aria-label={`${m.name} 삭제`}
                >
                  x
                </button>
              </span>
            ))}
            {search && filtered.length === 0 && (
              <span className="text-xs text-neutral-400">검색 결과 없음</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
