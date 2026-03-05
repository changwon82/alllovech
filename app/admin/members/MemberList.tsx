"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  bulkCreateChurchMembers,
  deleteChurchMember,
  deleteAllChurchMembers,
  bulkUpdateMemberFields,
  updateChurchMember,
} from "./actions";

interface DakobangMembership {
  role: string;
  dakobang_groups: { name: string } | { name: string }[] | null;
}

interface ChurchMember {
  id: string;
  name: string;
  gender?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  dakobang_group_members?: DakobangMembership[];
}

interface Props {
  initialMembers: ChurchMember[];
  onMembersChange?: (members: ChurchMember[]) => void;
  hideList?: boolean;
}

export default function MemberList({ initialMembers, onMembersChange, hideList }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [tooltip, setTooltip] = useState<{ groupName: string; x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  function updateMembers(next: ChurchMember[]) {
    setMembers(next);
    onMembersChange?.(next);
  }
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkResult, setBulkResult] = useState<{ matched: string[]; unmatched: string[] } | null>(null);
  const [filter, setFilter] = useState<"all" | "unassigned" | string>("all");
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ name: "", gender: "", birth_date: "", phone: "" });
  const [isPending, startTransition] = useTransition();
  const perPage = 40;

  // 다코방 그룹 목록 추출 (이름순)
  const groups = Array.from(
    new Map(
      members.flatMap((m) =>
        (m.dakobang_group_members ?? []).map((g) => {
          const dg = g.dakobang_groups;
          const name = Array.isArray(dg) ? dg[0]?.name : dg?.name;
          return name ? [name, name] as [string, string] : null;
        }).filter((x): x is [string, string] => x !== null)
      )
    ).entries()
  ).sort(([a], [b]) => a.localeCompare(b, "ko"));

  const filtered = members
    .filter((m) => {
      if (filter === "all") return true;
      if (filter === "unassigned") return !m.dakobang_group_members?.length;
      return (m.dakobang_group_members ?? []).some((g) => {
        const dg = g.dakobang_groups;
        const name = Array.isArray(dg) ? dg[0]?.name : dg?.name;
        return name === filter;
      });
    })
    .filter((m) => {
      if (!search) return true;
      if (m.name.includes(search)) return true;
      const roleLabels: Record<string, string> = { ministry_team: "담당장로", leader: "방장", sub_leader: "부방장", member: "방원" };
      return (m.dakobang_group_members ?? []).some((g) => {
        const dg = g.dakobang_groups;
        const groupName = Array.isArray(dg) ? dg[0]?.name : dg?.name;
        return groupName?.includes(search) || roleLabels[g.role]?.includes(search);
      });
    });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = showAll ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

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
        const next = [...members, ...(res.data as ChurchMember[])]
          .sort((a, b) => a.name.localeCompare(b.name, "ko"));
        updateMembers(next);
        setInput("");
        setSearch("");
        setFilter("all");
        setPage(1);
        router.refresh();
      }
    });
  }

  function handleEdit(m: ChurchMember) {
    setEditingId(m.id);
    setEditFields({ name: m.name, gender: m.gender ?? "", birth_date: m.birth_date ?? "", phone: m.phone ?? "" });
  }

  function handleSave() {
    if (!editingId) return;
    startTransition(async () => {
      const res = await updateChurchMember(editingId, {
        name: editFields.name.trim() || undefined,
        gender: editFields.gender || undefined,
        birth_date: editFields.birth_date || undefined,
        phone: editFields.phone || undefined,
      });
      if (res.error) {
        alert("수정 실패: " + res.error);
      } else {
        updateMembers(members.map((m) => m.id === editingId ? { ...m, ...editFields } : m));
        setEditingId(null);
        router.refresh();
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
    if (!confirm("교인명단 전체를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;

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

  const COLUMN_MAP: Record<string, "gender" | "birth_date" | "phone"> = {
    성별: "gender", 생년월일: "birth_date", 전화번호: "phone",
  };

  function parseBulkText(text: string) {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return null;
    const headers = lines[0].split(/\t|,/).map((h) => h.trim());
    const nameIdx = headers.indexOf("이름");
    if (nameIdx === -1) return null;
    return lines.slice(1).map((line) => {
      const cells = line.split(/\t|,/).map((c) => c.trim());
      const row: Record<string, string> = { name: cells[nameIdx] ?? "" };
      headers.forEach((h, i) => {
        const field = COLUMN_MAP[h];
        if (field && cells[i] !== undefined) row[field] = cells[i];
      });
      return row as { name: string; gender?: string; birth_date?: string; phone?: string };
    }).filter((r) => r.name);
  }

  function handleBulkUpdate() {
    const rows = parseBulkText(bulkText);
    if (!rows) { alert("첫 줄에 '이름'을 포함한 헤더가 필요합니다."); return; }
    startTransition(async () => {
      const res = await bulkUpdateMemberFields(rows);
      if ("error" in res) { alert("오류: " + res.error); return; }
      setBulkResult(res);
      setBulkText("");
      router.refresh();
    });
  }

  function getGroupInfo(groupName: string) {
    const roleOrder = ["ministry_team", "leader", "sub_leader", "member"];
    const labels: Record<string, string> = { ministry_team: "담당장로", leader: "방장", sub_leader: "부방장", member: "방원" };
    const byRole: Record<string, string[]> = {};
    for (const m of members) {
      for (const g of m.dakobang_group_members ?? []) {
        const dg = g.dakobang_groups;
        const name = Array.isArray(dg) ? dg[0]?.name : dg?.name;
        if (name !== groupName) continue;
        if (!byRole[g.role]) byRole[g.role] = [];
        byRole[g.role].push(m.name);
      }
    }
    return roleOrder.filter((r) => byRole[r]).map((r) => ({ role: r, label: labels[r], names: byRole[r] }));
  }

  function highlightMatch(text: string, query: string) {
    const idx = text.indexOf(query);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="rounded bg-yellow-200 text-inherit">{query}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div>
      {/* 입력 영역 */}
      {hideList ? (
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
      ) : (
        <>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={(e) => { if (e.key === "Escape") { setSearch(""); setPage(1); } }}
            placeholder="전체 검색"
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs focus:border-navy focus:outline-none"
          />
          <button
            onClick={() => setPage(1)}
            className="rounded-xl bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            검색
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && input.trim() && !isPending) { e.preventDefault(); handleBulkAdd(); } }}
            placeholder="이름 입력 (쉼표로 구분)"
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs focus:border-navy focus:outline-none"
          />
          <button
            onClick={handleBulkAdd}
            disabled={isPending || !input.trim()}
            className="rounded-xl bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            등록
          </button>
          <button
            onClick={() => { setBulkOpen((o) => !o); setBulkResult(null); }}
            className="rounded-xl bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            {bulkOpen ? "닫기" : "대량입력"}
          </button>
          {isPending && <span className="text-xs text-neutral-400">처리 중...</span>}
        </div>

        {/* 대량 입력 */}

        {bulkOpen && (
          <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-medium text-neutral-600">
              첫 줄에 헤더, 나머지 줄에 데이터를 입력하세요. 엑셀에서 복사 후 붙여넣기 가능합니다.
            </p>
            <p className="mb-2 text-xs text-neutral-400">
              사용 가능한 컬럼명: <span className="font-mono">이름, 성별, 생년월일, 전화번호</span>
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"이름\t성별\n홍길동\t남\n김철수\t남\n이영희\t여"}
              rows={6}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs focus:border-navy focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={handleBulkUpdate}
                disabled={isPending || !bulkText.trim()}
                className="rounded-xl bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                업데이트
              </button>
              {bulkResult && (
                <span className="text-xs text-neutral-500">
                  ✓ {bulkResult.matched.length}명 업데이트
                  {bulkResult.unmatched.length > 0 && (
                    <span className="ml-2 text-red-400">
                      미매칭: {bulkResult.unmatched.join(", ")}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        )}
        </>
      )}

      {/* 명단 테이블 */}
      {!hideList && members.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 space-y-2">
            {/* 필터 버튼 */}
            <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "all", label: `전체 ${members.length}` },
                { key: "unassigned", label: `미소속 ${members.filter((m) => !m.dakobang_group_members?.length).length}` },
                ...groups.map(([name]) => ({
                  key: name,
                  label: `${name} ${members.filter((m) => (m.dakobang_group_members ?? []).some((g) => {
                    const dg = g.dakobang_groups;
                    return (Array.isArray(dg) ? dg[0]?.name : dg?.name) === name;
                  })).length}`,
                })),
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setFilter(key); setPage(1); }}
                  className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                    filter === key
                      ? "bg-navy font-medium text-white"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs text-neutral-500 whitespace-nowrap">
                  <th className="w-12 py-[3.2px] pl-5 pr-2 text-center font-medium">#</th>
                  <th className="w-24 px-4 py-[3.2px] text-center font-medium">이름</th>
                  <th className="px-4 py-[3.2px] text-center font-medium">다코방</th>
                  <th className="w-16 px-4 py-[3.2px] text-center font-medium">성별</th>
                  <th className="w-28 px-4 py-[3.2px] text-center font-medium">생년월일</th>
                  <th className="w-40 px-4 py-[3.2px] text-center font-medium">전화번호</th>
                  <th className="px-4 py-[3.2px] pr-5 font-medium" />
                </tr>
              </thead>
              <tbody className="text-left">
                {paged.map((m, i) => (
                  <tr
                    key={m.id}
                    className="group border-b border-neutral-50 whitespace-nowrap transition-colors last:border-b-0 hover:bg-neutral-50"
                  >
                    <td className="py-[3.2px] pl-5 pr-2 text-center text-xs text-neutral-400">{(page - 1) * perPage + i + 1}</td>
                    <td className="px-4 py-[3.2px] text-center font-medium text-neutral-800">
                      {editingId === m.id
                        ? <input value={editFields.name} onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))} className="w-full rounded border border-navy/30 px-1.5 py-0.5 text-xs focus:border-navy focus:outline-none" />
                        : search ? highlightMatch(m.name, search) : m.name}
                    </td>
                    <td className="overflow-hidden whitespace-normal px-4 py-[3.2px] text-neutral-600">
                      {m.dakobang_group_members?.length
                        ? (() => {
                            const labels: Record<string, string> = { ministry_team: "담당장로", leader: "방장", sub_leader: "부방장", member: "방원" };
                            const pillColors: Record<string, string> = {
                              ministry_team: "bg-green-50 text-green-700 ring-1 ring-green-200",
                              leader: "bg-red-50 text-red-600 ring-1 ring-red-200",
                              sub_leader: "bg-orange-50 text-orange-600 ring-1 ring-orange-200",
                              member: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
                            };
                            const roleOrder = ["ministry_team", "leader", "sub_leader", "member"];
                            // 역할별로 그룹명 묶기
                            const byRole = new Map<string, string[]>();
                            for (const g of m.dakobang_group_members) {
                              const dg = g.dakobang_groups;
                              const name = Array.isArray(dg) ? dg[0]?.name : dg?.name;
                              if (!name) continue;
                              if (!byRole.has(g.role)) byRole.set(g.role, []);
                              byRole.get(g.role)!.push(name);
                            }
                            return (
                              <div className="flex flex-wrap gap-1">
                                {roleOrder.filter((r) => byRole.has(r)).flatMap((r) =>
                                  byRole.get(r)!.map((name) => (
                                    <span
                                      key={`${r}-${name}`}
                                      className={`inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-xs font-medium ${pillColors[r]}`}
                                      onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setTooltip({ groupName: name, x: rect.left, y: rect.bottom + window.scrollY + 6 });
                                      }}
                                      onMouseLeave={() => setTooltip(null)}
                                    >
                                      {search ? highlightMatch(name, search) : name}
                                      {" · "}
                                      {search ? highlightMatch(labels[r], search) : labels[r]}
                                    </span>
                                  ))
                                )}
                              </div>
                            );
                          })()
                        : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-[3.2px] text-center text-neutral-600">
                      {editingId === m.id
                        ? <input value={editFields.gender} onChange={(e) => setEditFields((f) => ({ ...f, gender: e.target.value }))} placeholder="남/여" className="w-full rounded border border-navy/30 px-1.5 py-0.5 text-center text-xs focus:border-navy focus:outline-none" />
                        : m.gender ?? <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-[3.2px] text-center text-neutral-600">
                      {editingId === m.id
                        ? <input value={editFields.birth_date} onChange={(e) => setEditFields((f) => ({ ...f, birth_date: e.target.value }))} placeholder="1990-01-01" className="w-full rounded border border-navy/30 px-1.5 py-0.5 text-center text-xs focus:border-navy focus:outline-none" />
                        : m.birth_date ?? <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-[3.2px] text-center text-neutral-600">
                      {editingId === m.id
                        ? <input value={editFields.phone} onChange={(e) => setEditFields((f) => ({ ...f, phone: e.target.value }))} placeholder="010-0000-0000" className="w-full rounded border border-navy/30 px-1.5 py-0.5 text-center text-xs focus:border-navy focus:outline-none" />
                        : m.phone ?? <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-[3.2px] pr-5 text-right">
                      {editingId === m.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="rounded-lg px-2 py-[3.2px] text-xs text-blue-500 transition-all hover:bg-blue-50 disabled:opacity-50"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg px-2 py-[3.2px] text-xs text-neutral-400 transition-all hover:bg-neutral-100"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-all group-hover:opacity-100">
                          <button
                            onClick={() => handleEdit(m)}
                            className="rounded-lg px-2 py-[3.2px] text-xs text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600"
                            aria-label={`${m.name} 수정`}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="rounded-lg px-2 py-[3.2px] text-xs text-neutral-400 transition-all hover:bg-red-50 hover:text-red-400"
                            aria-label={`${m.name} 삭제`}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {search && filtered.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-neutral-400">
                검색 결과 없음
              </div>
            )}
          </div>

          {!showAll && totalPages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="rounded-lg px-2.5 py-[3.2px] text-xs text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
              >
                « 처음
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-2.5 py-[3.2px] text-xs text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
              >
                ‹ 이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-2.5 py-[3.2px] text-xs transition-colors ${
                    p === page
                      ? "bg-navy font-medium text-white"
                      : "text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg px-2.5 py-[3.2px] text-xs text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
              >
                다음 ›
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="rounded-lg px-2.5 py-[3.2px] text-xs text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
              >
                마지막 »
              </button>
            </div>
          )}
        </div>
      )}
      {/* 다코방 툴팁 */}
      {tooltip && (() => {
        const info = getGroupInfo(tooltip.groupName);
        const roleColors: Record<string, string> = { ministry_team: "text-green-600", leader: "text-red-500", sub_leader: "text-orange-500", member: "text-blue-500" };
        return (
          <div
            ref={tooltipRef}
            style={{ position: "fixed", left: tooltip.x, top: tooltip.y - window.scrollY, zIndex: 50 }}
            className="w-56 rounded-xl bg-white p-3 shadow-lg ring-1 ring-neutral-200"
            onMouseEnter={() => {/* 툴팁 위에 마우스 올려도 유지 */}}
            onMouseLeave={() => setTooltip(null)}
          >
            <p className="mb-2 text-xs font-bold text-neutral-700">{tooltip.groupName}</p>
            <div className="space-y-1.5">
              {info.map(({ role, label, names }) => (
                <div key={role}>
                  <span className={`text-xs font-medium ${roleColors[role]}`}>{label}</span>
                  <span className="ml-1.5 text-xs text-neutral-600">{names.join(", ")}</span>
                </div>
              ))}
              {info.length === 0 && <p className="text-xs text-neutral-400">구성원 없음</p>}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
