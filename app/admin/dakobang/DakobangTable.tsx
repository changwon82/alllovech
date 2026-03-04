"use client";

import { useState, useTransition, useMemo, useRef, useCallback } from "react";
import {
  createDakobangGroup,
  deleteDakobangGroup,
  bulkUpdateDakobangGroups,
  bulkSetGroupMembers,
} from "./actions";
import MemberChipSelector, { type MemberOption } from "./MemberChipSelector";

// ── 타입 ──

interface GroupMemberRow {
  id: string;
  member_id: string;
  role: string;
  sort_order: number;
  church_members: { id: string; name: string };
}

interface DakobangGroup {
  id: string;
  ministry_team: string;
  name: string;
  leaders: string;
  sub_leaders: string;
  members: string;
  sort_order: number;
  dakobang_group_members: GroupMemberRow[];
}

type Role = "ministry_team" | "leader" | "sub_leader" | "member";

interface Props {
  initialGroups: DakobangGroup[];
  allMembers: MemberOption[];
}

interface NewRow {
  key: number;
  name: string;
  members: Record<Role, MemberOption[]>;
}

const ROLES: Role[] = ["ministry_team", "leader", "sub_leader", "member"];

function getMembersForRole(group: DakobangGroup, role: Role): MemberOption[] {
  return (group.dakobang_group_members ?? [])
    .filter((gm) => gm.role === role)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((gm) => ({
      id: gm.church_members.id,
      name: gm.church_members.name,
    }));
}

export default function DakobangTable({ initialGroups, allMembers }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [search, setSearch] = useState("");

  // 수정 모드
  const [bulkEditing, setBulkEditing] = useState(false);
  const [bulkNames, setBulkNames] = useState<Record<string, string>>({});
  const [bulkMembers, setBulkMembers] = useState<
    Record<string, Record<Role, MemberOption[]>>
  >({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [newRows, setNewRows] = useState<NewRow[]>([]);
  const [nextKey, setNextKey] = useState(0);

  const [isPending, startTransition] = useTransition();

  // 열 너비 (px, 마지막 열은 auto)
  const COL_DEFAULTS = [40, 140, 180, 130, 120]; // #, 시무장로, 이름, 방장, 부방장
  const STORAGE_KEY = "dakobang-col-widths";

  const [colWidths, setColWidths] = useState<number[]>(() => {
    if (typeof window === "undefined") return COL_DEFAULTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === COL_DEFAULTS.length) return parsed;
      }
    } catch { /* ignore */ }
    return COL_DEFAULTS;
  });

  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const onResizeStart = useCallback((colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = { colIdx, startX: e.clientX, startW: colWidths[colIdx] };

    function onMove(ev: MouseEvent) {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const newW = Math.max(40, resizingRef.current.startW + diff);
      setColWidths((prev) => {
        const next = [...prev];
        next[colIdx] = newW;
        return next;
      });
    }
    function onUp() {
      resizingRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      // localStorage에 저장
      setColWidths((cur) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cur)); } catch { /* ignore */ }
        return cur;
      });
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [colWidths]);

  // 행 목록 (삭제 예정 제외)
  const filtered = useMemo(() => {
    let result = groups;
    if (deletedIds.size > 0) {
      result = result.filter((g) => !deletedIds.has(g.id));
    }
    return result;
  }, [groups, deletedIds]);

  // 검색 매칭 수
  const searchMatchCount = useMemo(() => {
    if (!search) return 0;
    const q = search.toLowerCase();
    let count = 0;
    for (const g of filtered) {
      const names = (g.dakobang_group_members ?? []).map((gm) => gm.church_members.name);
      if (g.name.toLowerCase().includes(q) || names.some((n) => n.toLowerCase().includes(q))) {
        count++;
      }
    }
    return count;
  }, [filtered, search]);

  // 검색 하이라이트 헬퍼
  function highlightName(text: string): React.ReactNode {
    if (!search) return text || <span className="text-neutral-300">-</span>;
    const idx = text.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return text || <span className="text-neutral-300">-</span>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="rounded-sm bg-yellow-200/80">{text.slice(idx, idx + search.length)}</mark>
        {text.slice(idx + search.length)}
      </>
    );
  }

  // 그룹핑 헬퍼
  function isFirstInMinistryTeam(index: number) {
    if (index === 0) return true;
    const curTeam = getMembersForRole(filtered[index], "ministry_team")
      .map((m) => m.id)
      .sort()
      .join(",");
    const prevTeam = getMembersForRole(filtered[index - 1], "ministry_team")
      .map((m) => m.id)
      .sort()
      .join(",");
    return curTeam !== prevTeam;
  }

  function isFirstInName(index: number) {
    if (index === 0) return true;
    const cur = filtered[index];
    const prev = filtered[index - 1];
    if (!cur.name) return true;
    if (cur.name !== prev.name) return true;
    return isFirstInMinistryTeam(index);
  }

  function getTeamColorIndex(index: number): number {
    if (!filtered.length) return 0;
    let teamIdx = 0;
    for (let i = 1; i <= index; i++) {
      if (isFirstInMinistryTeam(i)) teamIdx++;
    }
    return teamIdx;
  }

  // ── 수정 모드 ──

  function startBulkEdit() {
    const names: Record<string, string> = {};
    const members: Record<string, Record<Role, MemberOption[]>> = {};
    groups.forEach((g) => {
      names[g.id] = g.name;
      members[g.id] = {
        ministry_team: getMembersForRole(g, "ministry_team"),
        leader: getMembersForRole(g, "leader"),
        sub_leader: getMembersForRole(g, "sub_leader"),
        member: getMembersForRole(g, "member"),
      };
    });
    setBulkNames(names);
    setBulkMembers(members);
    setBulkEditing(true);
  }

  function cancelBulkEdit() {
    setBulkEditing(false);
    setBulkNames({});
    setBulkMembers({});
    setNewRows([]);
    setDeletedIds(new Set());
  }

  function bulkAddMember(groupId: string, role: Role, member: MemberOption) {
    setBulkMembers((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [role]: [...(prev[groupId]?.[role] ?? []), member],
      },
    }));
  }

  function bulkRemoveMember(groupId: string, role: Role, memberId: string) {
    setBulkMembers((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [role]: (prev[groupId]?.[role] ?? []).filter((m) => m.id !== memberId),
      },
    }));
  }

  // 드래그 앤 드롭: 셀 간 이동 또는 같은 셀 내 순서 변경
  function handleMemberDrop(
    targetGroupId: string,
    targetRole: Role,
    member: MemberOption,
    fromGroupId: string,
    fromRole: string,
    dropIndex: number,
  ) {
    setBulkMembers((prev) => {
      const next = { ...prev };
      const sameCell = targetGroupId === fromGroupId && targetRole === fromRole;

      if (sameCell) {
        const list = [...(next[targetGroupId][targetRole] ?? [])];
        const curIdx = list.findIndex((m) => m.id === member.id);
        if (curIdx === -1) return prev;
        list.splice(curIdx, 1);
        const adjusted = curIdx < dropIndex ? dropIndex - 1 : dropIndex;
        list.splice(adjusted, 0, member);
        next[targetGroupId] = { ...next[targetGroupId], [targetRole]: list };
      } else {
        if (next[fromGroupId]) {
          next[fromGroupId] = {
            ...next[fromGroupId],
            [fromRole]: (next[fromGroupId][fromRole as Role] ?? []).filter((m) => m.id !== member.id),
          };
        }
        if (next[targetGroupId]) {
          const targetList = [...(next[targetGroupId][targetRole] ?? [])];
          if (!targetList.some((m) => m.id === member.id)) {
            targetList.splice(dropIndex, 0, member);
            next[targetGroupId] = { ...next[targetGroupId], [targetRole]: targetList };
          }
        }
      }
      return next;
    });
  }

  function markForDelete(id: string) {
    setDeletedIds((prev) => new Set(prev).add(id));
  }

  // ── 저장 (수정 + 추가 + 삭제 한번에) ──

  function saveBulkEdit() {
    // 텍스트 필드 변경 수집 (삭제 예정 제외)
    const nameChanges: { id: string; ministry_team: string; name: string; leaders: string; sub_leaders: string; members: string; sort_order: number }[] = [];
    groups.forEach((g) => {
      if (deletedIds.has(g.id)) return;
      const newName = bulkNames[g.id] ?? g.name;
      if (newName !== g.name) {
        nameChanges.push({
          id: g.id,
          ministry_team: g.ministry_team,
          name: newName,
          leaders: g.leaders,
          sub_leaders: g.sub_leaders,
          members: g.members,
          sort_order: g.sort_order,
        });
      }
    });

    // 관계형 멤버 변경 수집 (삭제 예정 제외)
    const memberUpdates: { groupId: string; role: Role; memberIds: string[] }[] = [];
    groups.forEach((g) => {
      if (deletedIds.has(g.id)) return;
      const bm = bulkMembers[g.id];
      if (!bm) return;
      ROLES.forEach((role) => {
        const original = getMembersForRole(g, role).map((m) => m.id);
        const updated = (bm[role] ?? []).map((m) => m.id);
        if (JSON.stringify(original) !== JSON.stringify(updated)) {
          memberUpdates.push({ groupId: g.id, role, memberIds: updated });
        }
      });
    });

    const hasChanges = nameChanges.length > 0 || memberUpdates.length > 0 || deletedIds.size > 0 || newRows.length > 0;
    if (!hasChanges) {
      cancelBulkEdit();
      return;
    }

    // 낙관적 업데이트
    const prevGroups = [...groups];
    setGroups((gs) =>
      gs
        .filter((g) => !deletedIds.has(g.id))
        .map((g) => {
          const newName = bulkNames[g.id] ?? g.name;
          const bm = bulkMembers[g.id];
          let updatedGm = g.dakobang_group_members;
          if (bm) {
            updatedGm = ROLES.flatMap((role) =>
              (bm[role] ?? []).map((m, i) => ({
                id: `temp-${g.id}-${role}-${m.id}`,
                member_id: m.id,
                role,
                sort_order: i,
                church_members: { id: m.id, name: m.name },
              })),
            );
          }
          return { ...g, name: newName, dakobang_group_members: updatedGm };
        }),
    );

    const rowsToDelete = [...deletedIds];
    const rowsToAdd = [...newRows];
    cancelBulkEdit();

    startTransition(async () => {
      try {
        // 수정 + 삭제 병렬 처리
        const promises: Promise<{ error?: string; success?: boolean }>[] = [];
        if (nameChanges.length > 0) promises.push(bulkUpdateDakobangGroups(nameChanges));
        if (memberUpdates.length > 0) promises.push(bulkSetGroupMembers(memberUpdates));
        for (const id of rowsToDelete) {
          promises.push(deleteDakobangGroup(id));
        }

        const results = await Promise.all(promises);
        const failed = results.filter((r) => r.error);
        if (failed.length) {
          alert("저장 실패: " + JSON.stringify(failed));
          setGroups(prevGroups);
          return;
        }

        // 새 행 추가
        if (rowsToAdd.length > 0) {
          const maxOrder = prevGroups.reduce((max, g) => Math.max(max, g.sort_order), 0);
          const created: DakobangGroup[] = [];

          for (let idx = 0; idx < rowsToAdd.length; idx++) {
            const row = rowsToAdd[idx];
            const res = await createDakobangGroup({
              ministry_team: "",
              name: row.name,
              leaders: "",
              sub_leaders: "",
              members: "",
              sort_order: maxOrder + idx + 1,
            });
            if (res.error) {
              alert(`행 ${idx + 1} 추가 실패: ${res.error}`);
              continue;
            }

            const newGroup = res.data as DakobangGroup;
            newGroup.dakobang_group_members = [];

            const memberUpds = ROLES
              .filter((role) => row.members[role].length > 0)
              .map((role) => ({
                groupId: newGroup.id,
                role,
                memberIds: row.members[role].map((m) => m.id),
              }));

            if (memberUpds.length > 0) {
              const memberRes = await bulkSetGroupMembers(memberUpds);
              if (memberRes.error) {
                alert(`행 ${idx + 1} 멤버 저장 실패: ${memberRes.error}`);
              }
              newGroup.dakobang_group_members = ROLES.flatMap((role) =>
                row.members[role].map((m, i) => ({
                  id: `temp-${newGroup.id}-${role}-${m.id}`,
                  member_id: m.id,
                  role,
                  sort_order: i,
                  church_members: { id: m.id, name: m.name },
                })),
              );
            }

            created.push(newGroup);
          }

          if (created.length > 0) {
            setGroups((gs) => [...gs, ...created]);
          }
        }
      } catch (e) {
        alert("저장 중 오류 발생: " + (e instanceof Error ? e.message : String(e)));
        setGroups(prevGroups);
      }
    });
  }

  // ── 새 행 ──

  function addNewRow() {
    setNewRows((prev) => [
      ...prev,
      { key: nextKey, name: "", members: { ministry_team: [], leader: [], sub_leader: [], member: [] } },
    ]);
    setNextKey((k) => k + 1);
  }

  function removeNewRow(key: number) {
    setNewRows((prev) => prev.filter((r) => r.key !== key));
  }

  function updateNewRowName(key: number, name: string) {
    setNewRows((prev) => prev.map((r) => (r.key === key ? { ...r, name } : r)));
  }

  function addNewRowMember(key: number, role: Role, member: MemberOption) {
    setNewRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, members: { ...r.members, [role]: [...r.members[role], member] } }
          : r,
      ),
    );
  }

  function removeNewRowMember(key: number, role: Role, memberId: string) {
    setNewRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, members: { ...r.members, [role]: r.members[role].filter((m) => m.id !== memberId) } }
          : r,
      ),
    );
  }

  // ── 스타일 ──

  const addInputClass = "w-full rounded border border-neutral-200 px-2 py-1 text-sm focus:border-navy focus:outline-none";

  return (
    <div>
      {/* 상단 액션 바 */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="이름, 다코방 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={bulkEditing}
            className="rounded-lg border border-neutral-200 px-3 py-2 pr-8 text-sm focus:border-navy focus:outline-none disabled:opacity-50"
          />
          {search && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-medium text-red-400">
              {searchMatchCount}
            </span>
          )}
        </div>
        {bulkEditing ? (
          <>
            <button
              onClick={saveBulkEdit}
              disabled={isPending}
              className="rounded-xl bg-navy px-5 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
            >
              저장
            </button>
            <button
              onClick={cancelBulkEdit}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-100 active:scale-95"
            >
              취소
            </button>
            <button
              onClick={addNewRow}
              className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
            >
              + 새 행
            </button>
          </>
        ) : (
          <button
            onClick={startBulkEdit}
            className="rounded-xl border border-navy px-4 py-2 text-sm font-medium text-navy transition-all hover:bg-navy/5 active:scale-95"
          >
            수정
          </button>
        )}
        {isPending && (
          <span className="text-xs text-neutral-400">저장 중...</span>
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>{colWidths.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}<col key="flex" /></colgroup>
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium text-neutral-500">
              {["#", "담당 시무장로", "다코방 이름", "방장", "부방장"].map((label, i) => (
                <th key={label} className="relative px-3 py-2.5 select-none">
                  {label}
                  <span
                    onMouseDown={(e) => onResizeStart(i, e)}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-accent/40"
                  />
                </th>
              ))}
              <th className="px-3 py-2.5">방원</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g, i) => {
              const teamColorIdx = getTeamColorIndex(i);
              const bgClass = teamColorIdx % 2 === 0 ? "bg-white" : "bg-neutral-50/70";
              const showTeam = bulkEditing || isFirstInMinistryTeam(i);
              const showName = bulkEditing || isFirstInName(i);
              const isTeamStart = !bulkEditing && isFirstInMinistryTeam(i) && i > 0;
              const isTeamEnd = !bulkEditing && (i === filtered.length - 1 || isFirstInMinistryTeam(i + 1));
              const teamBorder = isTeamStart
                ? "border-t-2 border-t-neutral-300" + (isTeamEnd ? " border-b border-neutral-200" : "")
                : isTeamEnd
                  ? "border-b border-neutral-200"
                  : "";

              return (
                <tr key={g.id} className={`${teamBorder} ${bgClass} hover:bg-neutral-200/60`}>
                  <td className="px-3 py-1.5 text-neutral-400">
                    {bulkEditing ? (
                      <button
                        onClick={() => markForDelete(g.id)}
                        className="rounded p-0.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-400"
                        title="행 삭제"
                      >
                        ✕
                      </button>
                    ) : (
                      i + 1
                    )}
                  </td>

                  {/* 담당 시무장로 */}
                  <td className="px-1.5 py-1 align-top">
                    {showTeam ? (
                      <MemberChipSelector
                        selected={bulkEditing ? (bulkMembers[g.id]?.ministry_team ?? []) : getMembersForRole(g, "ministry_team")}
                        allMembers={allMembers}
                        onAdd={(m) => bulkAddMember(g.id, "ministry_team", m)}
                        onRemove={(mid) => bulkRemoveMember(g.id, "ministry_team", mid)}
                        editing={bulkEditing}
                        highlightQuery={search}
                        dragGroupId={g.id}
                        dragRole="ministry_team"
                        onMemberDrop={(m, fgid, fr, di) => handleMemberDrop(g.id, "ministry_team", m, fgid, fr as Role, di)}
                      />
                    ) : null}
                  </td>

                  {/* 다코방 이름 */}
                  <td className="px-1.5 py-1 align-top font-medium text-neutral-700">
                    {showName ? (
                      bulkEditing ? (
                        <input
                          value={bulkNames[g.id] ?? g.name}
                          onChange={(e) => setBulkNames((prev) => ({ ...prev, [g.id]: e.target.value }))}
                          className="w-full bg-transparent px-1.5 py-0.5 text-sm font-medium outline-none focus:bg-accent-light/40 focus:ring-1 focus:ring-accent/30 rounded"
                        />
                      ) : (() => {
                        const uniqueIds = new Set([
                          ...getMembersForRole(g, "leader").map((m) => m.id),
                          ...getMembersForRole(g, "sub_leader").map((m) => m.id),
                          ...getMembersForRole(g, "member").map((m) => m.id),
                        ]);
                        return (
                          <span className="px-1.5">
                            {highlightName(g.name)}
                            {uniqueIds.size > 0 && (
                              <span className="ml-1.5 text-xs font-normal text-red-400">{uniqueIds.size}</span>
                            )}
                          </span>
                        );
                      })()
                    ) : null}
                  </td>

                  {/* 방장 */}
                  <td className="px-1.5 py-1 align-top">
                    <MemberChipSelector
                      selected={bulkEditing ? (bulkMembers[g.id]?.leader ?? []) : getMembersForRole(g, "leader")}
                      allMembers={allMembers}
                      onAdd={(m) => bulkAddMember(g.id, "leader", m)}
                      onRemove={(mid) => bulkRemoveMember(g.id, "leader", mid)}
                      editing={bulkEditing}
                      highlightQuery={search}
                      dragGroupId={g.id}
                      dragRole="leader"
                      onMemberDrop={(m, fgid, fr, di) => handleMemberDrop(g.id, "leader", m, fgid, fr as Role, di)}
                    />
                  </td>

                  {/* 부방장 */}
                  <td className="px-1.5 py-1 align-top">
                    <MemberChipSelector
                      selected={bulkEditing ? (bulkMembers[g.id]?.sub_leader ?? []) : getMembersForRole(g, "sub_leader")}
                      allMembers={allMembers}
                      onAdd={(m) => bulkAddMember(g.id, "sub_leader", m)}
                      onRemove={(mid) => bulkRemoveMember(g.id, "sub_leader", mid)}
                      editing={bulkEditing}
                      highlightQuery={search}
                      dragGroupId={g.id}
                      dragRole="sub_leader"
                      onMemberDrop={(m, fgid, fr, di) => handleMemberDrop(g.id, "sub_leader", m, fgid, fr as Role, di)}
                    />
                  </td>

                  {/* 방원 */}
                  <td className="px-1.5 py-1 align-top">
                    <MemberChipSelector
                      selected={bulkEditing ? (bulkMembers[g.id]?.member ?? []) : getMembersForRole(g, "member")}
                      allMembers={allMembers}
                      onAdd={(m) => bulkAddMember(g.id, "member", m)}
                      onRemove={(mid) => bulkRemoveMember(g.id, "member", mid)}
                      editing={bulkEditing}
                      highlightQuery={search}
                      dragGroupId={g.id}
                      dragRole="member"
                      onMemberDrop={(m, fgid, fr, di) => handleMemberDrop(g.id, "member", m, fgid, fr as Role, di)}
                    />
                  </td>
                </tr>
              );
            })}

            {/* 새 행 (수정 모드에서만) */}
            {bulkEditing && newRows.map((row) => (
              <tr key={`new-${row.key}`} className="border-b border-neutral-100 bg-accent-light/40">
                <td className="px-3 py-1.5">
                  <button
                    onClick={() => removeNewRow(row.key)}
                    className="rounded p-0.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-400"
                    title="새 행 제거"
                  >
                    ✕
                  </button>
                </td>
                <td className="px-1 py-1">
                  <MemberChipSelector
                    selected={row.members.ministry_team}
                    allMembers={allMembers}
                    onAdd={(m) => addNewRowMember(row.key, "ministry_team", m)}
                    onRemove={(id) => removeNewRowMember(row.key, "ministry_team", id)}
                    editing
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    value={row.name}
                    onChange={(e) => updateNewRowName(row.key, e.target.value)}
                    className={addInputClass}
                    placeholder="다코방 이름"
                  />
                </td>
                <td className="px-1 py-1">
                  <MemberChipSelector
                    selected={row.members.leader}
                    allMembers={allMembers}
                    onAdd={(m) => addNewRowMember(row.key, "leader", m)}
                    onRemove={(id) => removeNewRowMember(row.key, "leader", id)}
                    editing
                  />
                </td>
                <td className="px-1 py-1">
                  <MemberChipSelector
                    selected={row.members.sub_leader}
                    allMembers={allMembers}
                    onAdd={(m) => addNewRowMember(row.key, "sub_leader", m)}
                    onRemove={(id) => removeNewRowMember(row.key, "sub_leader", id)}
                    editing
                  />
                </td>
                <td className="px-1 py-1">
                  <MemberChipSelector
                    selected={row.members.member}
                    allMembers={allMembers}
                    onAdd={(m) => addNewRowMember(row.key, "member", m)}
                    onRemove={(id) => removeNewRowMember(row.key, "member", id)}
                    editing
                  />
                </td>
              </tr>
            ))}

            {filtered.length === 0 && newRows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-neutral-400">
                  등록된 다코방이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
