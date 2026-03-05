"use client";

import { useState, useEffect, useTransition, useMemo, useRef, useCallback, Fragment } from "react";
import {
  createDakobangGroup,
  deleteDakobangGroup,
  bulkUpdateDakobangGroups,
  bulkSetGroupMembers,
} from "./actions";
import { bulkCreateChurchMembers } from "../members/actions";
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
  onMembersAdd?: (members: MemberOption[]) => void;
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

export default function DakobangTable({ initialGroups, allMembers, onMembersAdd }: Props) {
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
  const [editOrder, setEditOrder] = useState<string[]>([]);
  const [liveOrder, setLiveOrder] = useState<string[]>([]);
  const [dragRowId, setDragRowId] = useState<string | null>(null);
  const [movedRowIds, setMovedRowIds] = useState<Set<string>>(new Set());
  const [groupDragTeamKey, setGroupDragTeamKey] = useState<string | null>(null);
  const [justDropped, setJustDropped] = useState(false);
  // 드래그 중 시무장로 라이브 프리뷰: { [draggedRowId]: MemberOption[] }
  const [liveDragTeam, setLiveDragTeam] = useState<Record<string, MemberOption[]>>({});
  const lastRowDropTarget = useRef<{ targetId: string; dropAfter: boolean } | null>(null);
  const lastGroupDropTarget = useRef<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [regInput, setRegInput] = useState("");
  const [regPending, startRegTransition] = useTransition();

  function handleRegister() {
    const names = regInput.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    startRegTransition(async () => {
      const res = await bulkCreateChurchMembers(names);
      if (res.error) { alert("등록 실패: " + res.error); return; }
      if (res.data) {
        const added = (res.data as MemberOption[]).map((m) => ({ id: m.id, name: m.name }));
        onMembersAdd?.(added);
        setRegInput("");
      }
    });
  }

  // 열 너비 (px, 마지막 열은 auto)
  const COL_DEFAULTS = [50, 170, 240, 160, 150]; // #, 시무장로, 이름, 방장, 부방장
  const STORAGE_KEY = "dakobang-col-widths-v4";

  const [colWidths, setColWidths] = useState<number[]>(COL_DEFAULTS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === COL_DEFAULTS.length) {
          setColWidths(parsed);
        }
      }
    } catch { /* ignore */ }
  }, []);

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

  // 행 목록 (삭제 예정 제외, 시무장로 기준 정렬)
  const filtered = useMemo(() => {
    let result = groups;
    if (deletedIds.size > 0) {
      result = result.filter((g) => !deletedIds.has(g.id));
    }
    // 각 ministry_team 그룹의 첫 번째 행 sort_order를 기준으로 팀 순서 결정
    const teamFirstOrder = new Map<string, number>();
    for (const g of result) {
      const key = getMembersForRole(g, "ministry_team").map((m) => m.id).sort().join(",");
      if (key && !teamFirstOrder.has(key)) {
        teamFirstOrder.set(key, g.sort_order);
      }
    }
    return [...result].sort((a, b) => {
      const keyA = getMembersForRole(a, "ministry_team").map((m) => m.id).sort().join(",");
      const keyB = getMembersForRole(b, "ministry_team").map((m) => m.id).sort().join(",");
      if (!keyA && !keyB) return a.sort_order - b.sort_order;
      if (!keyA) return 1;
      if (!keyB) return -1;
      if (keyA !== keyB) {
        return (teamFirstOrder.get(keyA) ?? 0) - (teamFirstOrder.get(keyB) ?? 0);
      }
      return a.sort_order - b.sort_order;
    });
  }, [groups, deletedIds]);

  // 수정 모드 중 드래그로 재정렬된 순서를 반영한 표시용 배열
  const displayFiltered = useMemo(() => {
    if (!bulkEditing) return filtered;
    const order = liveOrder.length > 0 ? liveOrder : editOrder.length > 0 ? editOrder : filtered.map((g) => g.id);
    return order
      .map((id) => filtered.find((g) => g.id === id))
      .filter((g): g is DakobangGroup => g !== undefined);
  }, [bulkEditing, liveOrder, editOrder, filtered]);

  // 미소속 교인
  const unassignedMembers = useMemo(() => {
    const assignedIds = new Set(
      groups.flatMap((g) => (g.dakobang_group_members ?? []).map((gm) => gm.member_id))
    );
    return allMembers.filter((m) => !assignedIds.has(m.id));
  }, [groups, allMembers]);

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

  // 그룹핑 헬퍼 (displayFiltered + getTeamKey 기반 — 드래그 재정렬 즉각 반영)
  function isFirstInMinistryTeam(index: number) {
    if (index === 0) return true;
    if (index >= displayFiltered.length) return true;
    return getTeamKey(displayFiltered[index]) !== getTeamKey(displayFiltered[index - 1]);
  }

  function isFirstInName(index: number) {
    if (index === 0) return true;
    const cur = displayFiltered[index];
    const prev = displayFiltered[index - 1];
    if (!cur || !prev) return true;
    if (!cur.name) return true;
    if (cur.name !== prev.name) return true;
    return isFirstInMinistryTeam(index);
  }

  function getTeamColorIndex(index: number): number {
    if (!displayFiltered.length) return 0;
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
    setEditOrder(filtered.map((g) => g.id));
    setBulkEditing(true);
  }

  function cancelBulkEdit() {
    setBulkEditing(false);
    setBulkNames({});
    setBulkMembers({});
    setNewRows([]);
    setDeletedIds(new Set());
    setEditOrder([]);
    setLiveOrder([]);
    setDragRowId(null);
    setMovedRowIds(new Set());
    setGroupDragTeamKey(null);
    setLiveDragTeam({});
    lastRowDropTarget.current = null;
    lastGroupDropTarget.current = null;
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

  // ── 행 드래그: 대상 행 기반 시무장로 결정 ──

  /**
   * 드래그 대상 행(hoveredId)의 시무장로를 반환.
   * 사용자가 hover 중인 행의 그룹에 합류하는 의도이므로 해당 행의 팀이 정답.
   * hoveredId가 없으면 committed order에서 이웃 행으로 fallback.
   */
  function resolveTargetTeam(
    hoveredId: string | null,
    order: string[],
    sourceId: string,
  ): MemberOption[] | null {
    function teamOf(g: DakobangGroup | null): MemberOption[] | null {
      if (!g) return null;
      return bulkMembers[g.id]?.ministry_team ?? getMembersForRole(g, "ministry_team");
    }

    // 대상 행의 팀 우선 사용
    if (hoveredId) {
      const hovered = filtered.find((g) => g.id === hoveredId);
      const team = teamOf(hovered ?? null);
      if (team && team.length > 0) return team;
    }

    // fallback: committed order에서 이웃 행 확인
    const display = order
      .map((id) => filtered.find((g) => g.id === id))
      .filter((g): g is DakobangGroup => g !== undefined);
    const idx = display.findIndex((g) => g.id === sourceId);
    if (idx === -1) return null;

    const above = idx > 0 ? display[idx - 1] : null;
    const below = idx < display.length - 1 ? display[idx + 1] : null;

    const teamBelow = teamOf(below);
    const teamAbove = teamOf(above);

    if (teamBelow && teamBelow.length > 0) return teamBelow;
    if (teamAbove && teamAbove.length > 0) return teamAbove;
    return null;
  }

  // ── 행 드래그 앤 드롭 ──

  function handleRowDrop(e: React.DragEvent<HTMLTableRowElement>, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData("text/row-id");

    // sourceId가 없거나, 라이브 프리뷰도 없이 자기 자신에 드롭한 경우만 무시
    if (!sourceId || (sourceId === targetId && liveOrder.length === 0)) {
      setDragRowId(null);
      setLiveOrder([]);
      setLiveDragTeam({});
      lastRowDropTarget.current = null;
      return;
    }

    // liveOrder에 이미 최종 위치가 반영돼 있으면 그대로 커밋, 없으면 직접 계산
    const committed = liveOrder.length > 0 ? [...liveOrder] : (() => {
      const rect = e.currentTarget.getBoundingClientRect();
      const dropAfter = e.clientY > rect.top + rect.height / 2;
      const base = editOrder.length > 0 ? editOrder : filtered.map((g) => g.id);
      const next = [...base];
      const fromIdx = next.indexOf(sourceId);
      if (fromIdx === -1) return base;
      next.splice(fromIdx, 1);
      let toIdx = next.indexOf(targetId);
      if (dropAfter) toIdx++;
      if (toIdx < 0) toIdx = 0;
      next.splice(toIdx, 0, sourceId);
      return next;
    })();

    setEditOrder(committed);

    // 새 위치 기준 ministry_team 동기화
    const targetTeam = resolveTargetTeam(null, committed, sourceId);
    if (targetTeam) {
      setBulkMembers((prev) => {
        const current = prev[sourceId];
        if (!current) return prev;
        return {
          ...prev,
          [sourceId]: { ...current, ministry_team: targetTeam },
        };
      });
    }

    setMovedRowIds((prev) => new Set(prev).add(sourceId));
    setDragRowId(null);
    setLiveOrder([]);
    setLiveDragTeam({});
    lastRowDropTarget.current = null;
    setJustDropped(true);
  }

  function handleGroupDrop(e: React.DragEvent) {
    e.preventDefault();
    const srcTeamKey = e.dataTransfer.getData("text/group-team-key");
    if (!srcTeamKey || liveOrder.length === 0) {
      setGroupDragTeamKey(null);
      setLiveOrder([]);
      setLiveDragTeam({});
      lastGroupDropTarget.current = null;
      return;
    }

    const committed = [...liveOrder];
    setEditOrder(committed);

    const srcIds = committed.filter((id) => {
      const g = filtered.find((dg) => dg.id === id);
      return g ? getTeamKey(g) === srcTeamKey : false;
    });
    setMovedRowIds((prev) => {
      const next = new Set(prev);
      for (const id of srcIds) next.add(id);
      return next;
    });
    setGroupDragTeamKey(null);
    setLiveOrder([]);
    setLiveDragTeam({});
    lastGroupDropTarget.current = null;
    setJustDropped(true);
  }

  useEffect(() => {
    if (!justDropped) return;
    function onMove() { setJustDropped(false); }
    // 드롭 직후 발생하는 이벤트를 무시하기 위해 100ms 후에 리스너 등록
    const t = setTimeout(() => {
      document.addEventListener("mousemove", onMove, { once: true });
    }, 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousemove", onMove);
    };
  }, [justDropped]);

  // ── 저장 (수정 + 추가 + 삭제 한번에) ──

  function saveBulkEdit() {
    // 텍스트 필드 변경 수집 (삭제 예정 제외)
    const nameChanges: { id: string; ministry_team: string; name: string; leaders: string; sub_leaders: string; members: string; sort_order: number }[] = [];
    groups.forEach((g) => {
      if (deletedIds.has(g.id)) return;
      const newName = bulkNames[g.id] ?? g.name;
      const newSortOrder = editOrder.length > 0 ? editOrder.indexOf(g.id) + 1 : g.sort_order;
      if (newName !== g.name || newSortOrder !== g.sort_order) {
        nameChanges.push({
          id: g.id,
          ministry_team: g.ministry_team,
          name: newName,
          leaders: g.leaders,
          sub_leaders: g.sub_leaders,
          members: g.members,
          sort_order: newSortOrder,
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
    const savedEditOrder = editOrder.length > 0 ? [...editOrder] : null;
    setGroups((gs) =>
      gs
        .filter((g) => !deletedIds.has(g.id))
        .map((g) => {
          const newName = bulkNames[g.id] ?? g.name;
          const newSortOrder = savedEditOrder ? (savedEditOrder.indexOf(g.id) + 1 || g.sort_order) : g.sort_order;
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
          return { ...g, name: newName, sort_order: newSortOrder, dakobang_group_members: updatedGm };
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
            setGroups((gs) => {
              let result = [...gs];
              for (const newGroup of created) {
                const newTeamKey = (newGroup.dakobang_group_members ?? [])
                  .filter((gm) => gm.role === "ministry_team")
                  .map((gm) => gm.church_members.id)
                  .sort()
                  .join(",");

                // 같은 담당장로 구역의 마지막 행 뒤에 삽입
                let insertIdx = -1;
                if (newTeamKey) {
                  for (let i = result.length - 1; i >= 0; i--) {
                    const teamKey = (result[i].dakobang_group_members ?? [])
                      .filter((gm) => gm.role === "ministry_team")
                      .map((gm) => gm.church_members.id)
                      .sort()
                      .join(",");
                    if (teamKey === newTeamKey) {
                      insertIdx = i + 1;
                      break;
                    }
                  }
                }

                if (insertIdx === -1) {
                  result.push(newGroup);
                } else {
                  result.splice(insertIdx, 0, newGroup);
                }
              }
              return result;
            });
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

  // 담당장로 키 (liveDragTeam > bulkMembers > 원본 순으로 반영)
  function getTeamKey(g: DakobangGroup): string {
    const live = liveDragTeam[g.id];
    if (live) return live.map((m) => m.id).sort().join(",");
    const bm = bulkMembers[g.id];
    const members = bm ? (bm.ministry_team ?? []) : getMembersForRole(g, "ministry_team");
    return members.map((m) => m.id).sort().join(",");
  }

  // ── 스타일 ──

  const addInputClass = "w-full rounded border border-neutral-200 px-2 py-1 text-sm focus:border-navy focus:outline-none";

  const roleChipColor: Record<Role, string> = {
    ministry_team: "bg-green-50 text-green-700 ring-1 ring-green-200",
    leader: "bg-red-50 text-red-600 ring-1 ring-red-200",
    sub_leader: "bg-orange-50 text-orange-600 ring-1 ring-orange-200",
    member: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
  };

  return (
    <div>
      {/* 상단 액션 바 */}
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
        {/* 검색 */}
        <div className="relative">
          <input
            type="text"
            placeholder="전체 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={bulkEditing}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 pr-8 text-xs focus:border-navy focus:outline-none disabled:opacity-50"
          />
          {search && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-red-400">
              {searchMatchCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setSearch(search)}
          className="rounded-xl bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          검색
        </button>

        <div className="mx-1 h-4 w-px bg-neutral-200" />

        {/* 교인등록 */}
        <input
          type="text"
          value={regInput}
          onChange={(e) => setRegInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && regInput.trim() && !regPending) { e.preventDefault(); handleRegister(); } }}
          placeholder="이름 입력 (쉼표로 구분)"
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs focus:border-navy focus:outline-none"
        />
        <button
          onClick={handleRegister}
          disabled={regPending || !regInput.trim()}
          className="rounded-xl bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          등록
        </button>


        {/* 수정/저장/취소/새행 — 오른쪽 정렬 */}
        <div className="ml-auto flex items-center gap-2">
          {bulkEditing ? (
            <>
              <button
                onClick={saveBulkEdit}
                disabled={isPending}
                className="rounded-xl bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
              >
                저장
              </button>
              <button
                onClick={cancelBulkEdit}
                className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-all hover:bg-neutral-100 active:scale-95"
              >
                취소
              </button>
              <button
                onClick={addNewRow}
                className="rounded-xl bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
              >
                + 새 행
              </button>
              {isPending && <span className="text-xs text-neutral-400">저장 중...</span>}
            </>
          ) : (
            <button
              onClick={startBulkEdit}
              className="rounded-xl bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
            >
              수정
            </button>
          )}
        </div>
        </div>

        {/* 미소속 — 항상 두 번째 줄 */}
        {unassignedMembers.length > 0 && (
          <div className="flex items-baseline gap-1.5 text-xs">
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
              미소속 {unassignedMembers.length}명
            </span>
            <span className="text-neutral-400">
              {unassignedMembers.map((m) => m.name).join(", ")}
            </span>
          </div>
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
          <tbody
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setLiveOrder([]);
                setLiveDragTeam({});
                lastRowDropTarget.current = null;
                lastGroupDropTarget.current = null;
              }
            }}
          >
            {displayFiltered.map((g, i) => {
              const teamColorIdx = getTeamColorIndex(i);
              const bgClass = teamColorIdx % 2 === 0 ? "bg-white" : "bg-neutral-50/70";
              const showTeam = isFirstInMinistryTeam(i);
              const showName = isFirstInName(i);
              const isTeamStart = isFirstInMinistryTeam(i) && i > 0;
              const isTeamEnd = i === displayFiltered.length - 1 || isFirstInMinistryTeam(i + 1);
              const isLastInTeam = isTeamEnd;
              const teamKey = getTeamKey(g);
              const matchedNewRows = bulkEditing && isLastInTeam && teamKey
                ? newRows.filter((row) => row.members.ministry_team.map((m) => m.id).sort().join(",") === teamKey)
                : [];

              const isMovedRow = movedRowIds.has(g.id);
              const isLiveDragged = dragRowId === g.id || (groupDragTeamKey !== null && getTeamKey(g) === groupDragTeamKey);

              const borderTopClass = isTeamStart ? "border-t-2 border-t-neutral-300" : "";
              const borderBottomClass = isTeamEnd ? "border-b border-neutral-200" : "";
              const effectiveBg = isLiveDragged ? "bg-sky-100" : isMovedRow ? "bg-amber-50" : bgClass;
              const isDragging = dragRowId !== null || groupDragTeamKey !== null;

              return (
                <Fragment key={g.id}>
                <tr
                  className={`group/row ${borderTopClass} ${borderBottomClass} ${effectiveBg} ${(isDragging || justDropped) ? "" : "hover:bg-neutral-200/60"}`}
                  onDragOver={bulkEditing ? (e) => {
                    if (e.dataTransfer.types.includes("text/row-id")) {
                      e.preventDefault();
                      e.stopPropagation();
                      const sourceId = dragRowId;
                      if (!sourceId || sourceId === g.id) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const dropAfter = e.clientY > rect.top + rect.height / 2;
                      const last = lastRowDropTarget.current;
                      if (last?.targetId === g.id && last?.dropAfter === dropAfter) return;
                      lastRowDropTarget.current = { targetId: g.id, dropAfter };
                      // liveOrder 기반 계산 — UI와 동기화되어 진동 방지
                      const base = liveOrder.length > 0 ? liveOrder : (editOrder.length > 0 ? editOrder : filtered.map((dg) => dg.id));
                      const next = [...base];
                      const fromIdx = next.indexOf(sourceId);
                      if (fromIdx === -1) return;
                      next.splice(fromIdx, 1);
                      let toIdx = next.indexOf(g.id);
                      if (dropAfter) toIdx++;
                      if (toIdx < 0) toIdx = 0;
                      next.splice(toIdx, 0, sourceId);
                      setLiveOrder(next);
                      // 드래그 중 시무장로 라이브 프리뷰
                      const previewTeam = resolveTargetTeam(g.id, next, sourceId);
                      if (previewTeam) {
                        setLiveDragTeam({ [sourceId]: previewTeam });
                      }
                    } else if (e.dataTransfer.types.includes("text/group-team-key")) {
                      e.preventDefault();
                      e.stopPropagation();
                      const srcTeamKey = groupDragTeamKey;
                      if (!srcTeamKey) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const isUpperHalf = e.clientY < rect.top + rect.height / 2;
                      const insertAfterTeamKey = (isUpperHalf && showTeam)
                        ? (i > 0 ? getTeamKey(displayFiltered[i - 1]) : "START")
                        : teamKey;
                      if (insertAfterTeamKey === srcTeamKey) return;
                      if (lastGroupDropTarget.current === insertAfterTeamKey) return;
                      lastGroupDropTarget.current = insertAfterTeamKey;
                      const base = editOrder.length > 0 ? editOrder : filtered.map((dg) => dg.id);
                      const srcIds = base.filter((id) => {
                        const dg = filtered.find((x) => x.id === id);
                        return dg ? getTeamKey(dg) === srcTeamKey : false;
                      });
                      const remaining = base.filter((id) => !srcIds.includes(id));
                      let newOrder: string[];
                      if (insertAfterTeamKey === "START") {
                        newOrder = [...srcIds, ...remaining];
                      } else {
                        let insertAt = remaining.length;
                        for (let j = remaining.length - 1; j >= 0; j--) {
                          const dg = filtered.find((x) => x.id === remaining[j]);
                          if (dg && getTeamKey(dg) === insertAfterTeamKey) { insertAt = j + 1; break; }
                        }
                        const result = [...remaining];
                        result.splice(insertAt, 0, ...srcIds);
                        newOrder = result;
                      }
                      setLiveOrder(newOrder);
                    }
                  } : undefined}
                  onDrop={bulkEditing ? (e) => {
                    if (e.dataTransfer.types.includes("text/group-team-key")) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGroupDrop(e);
                    } else {
                      handleRowDrop(e, g.id);
                    }
                  } : undefined}
                >
                  <td className={`py-1.5 align-top text-neutral-400${bulkEditing ? " group/num px-1.5" : " px-3"}`}>
                    <div className="flex items-center gap-0.5 whitespace-nowrap">
                      {bulkEditing && (
                        <span
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData("text/row-id", g.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDragRowId(g.id);
                          }}
                          onDragEnd={() => { setDragRowId(null); setLiveOrder([]); setLiveDragTeam({}); lastRowDropTarget.current = null; }}
                          className="shrink-0 cursor-grab select-none text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
                          title="드래그하여 이동"
                        >
                          ⠿
                        </span>
                      )}
                      <span>{i + 1}</span>
                    </div>
                  </td>

                  {/* 담당 시무장로 — 읽기 모드: 첫 행만 표시 / 수정 모드: 모든 행 표시 */}
                  <td className="px-1.5 py-1 align-top">
                    <div className="flex items-center gap-1">
                      <div className="min-w-0 flex-1">
                        {(showTeam || bulkEditing) ? (
                          <MemberChipSelector
                            selected={bulkEditing ? (liveDragTeam[g.id] ?? bulkMembers[g.id]?.ministry_team ?? []) : getMembersForRole(g, "ministry_team")}
                            allMembers={allMembers}
                            onAdd={(m) => bulkAddMember(g.id, "ministry_team", m)}
                            onRemove={(mid) => bulkRemoveMember(g.id, "ministry_team", mid)}
                            editing={bulkEditing}
                            highlightQuery={search}
                            chipColorClass={roleChipColor.ministry_team}
                            dragGroupId={g.id}
                            dragRole="ministry_team"
                            nowrap
                            onMemberDrop={(m, fgid, fr, di) => handleMemberDrop(g.id, "ministry_team", m, fgid, fr as Role, di)}
                          />
                        ) : null}
                      </div>
                      {bulkEditing && showTeam && teamKey && (
                        <span
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData("text/group-team-key", teamKey);
                            e.dataTransfer.effectAllowed = "move";
                            setGroupDragTeamKey(teamKey);
                          }}
                          onDragEnd={() => { setGroupDragTeamKey(null); setLiveOrder([]); lastGroupDropTarget.current = null; }}
                          className="shrink-0 cursor-grab select-none text-neutral-400 hover:text-neutral-600 active:cursor-grabbing"
                          title="그룹 드래그하여 이동"
                        >
                          ☰
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 다코방 이름 */}
                  <td className="px-1.5 py-1 align-top font-medium text-neutral-700">
                    {showName ? (
                      bulkEditing ? (
                        <div className="flex h-7 w-full items-center">
                          <input
                            value={bulkNames[g.id] ?? g.name}
                            onChange={(e) => setBulkNames((prev) => ({ ...prev, [g.id]: e.target.value }))}
                            className="box-border w-full bg-transparent px-1.5 text-sm font-medium leading-[inherit] outline-none focus:bg-accent-light/40 focus:ring-1 focus:ring-accent/30 rounded"
                          />
                        </div>
                      ) : (() => {
                        const uniqueIds = new Set([
                          ...getMembersForRole(g, "leader").map((m) => m.id),
                          ...getMembersForRole(g, "sub_leader").map((m) => m.id),
                          ...getMembersForRole(g, "member").map((m) => m.id),
                        ]);
                        return (
                          <div className="flex h-7 items-center gap-1">
                            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-purple-200">
                              {highlightName(g.name)}
                            </span>
                            {uniqueIds.size > 0 && (
                              <span className="text-xs font-normal text-red-400">{uniqueIds.size}</span>
                            )}
                          </div>
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
                      chipColorClass={roleChipColor.leader}
                      dragGroupId={g.id}
                      dragRole="leader"
                      nowrap
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
                      chipColorClass={roleChipColor.sub_leader}
                      dragGroupId={g.id}
                      dragRole="sub_leader"
                      nowrap
                      onMemberDrop={(m, fgid, fr, di) => handleMemberDrop(g.id, "sub_leader", m, fgid, fr as Role, di)}
                    />
                  </td>

                  {/* 방원 */}
                  <td className="px-1.5 py-1 align-top">
                    <div className="flex items-start gap-1">
                      <div className="min-w-0 flex-1">
                        <MemberChipSelector
                          selected={bulkEditing ? (bulkMembers[g.id]?.member ?? []) : getMembersForRole(g, "member")}
                          allMembers={allMembers}
                          onAdd={(m) => bulkAddMember(g.id, "member", m)}
                          onRemove={(mid) => bulkRemoveMember(g.id, "member", mid)}
                          editing={bulkEditing}
                          highlightQuery={search}
                          chipColorClass={roleChipColor.member}
                          dragGroupId={g.id}
                          dragRole="member"
                          onMemberDrop={(m, fgid, fr, di) => handleMemberDrop(g.id, "member", m, fgid, fr as Role, di)}
                        />
                      </div>
                      {bulkEditing && (
                        <button
                          onClick={() => markForDelete(g.id)}
                          className="mt-0.5 hidden shrink-0 rounded p-0.5 text-neutral-300 transition-all hover:bg-red-50 hover:text-red-400 group-hover/row:inline-flex"
                          title="행 삭제"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {matchedNewRows.map((row) => (
                  <tr key={`new-${row.key}`} className="border-b border-neutral-100 bg-accent-light/40">
                    <td className="px-3 py-1.5">
                      <button onClick={() => removeNewRow(row.key)} className="rounded p-0.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-400" title="새 행 제거">✕</button>
                    </td>
                    <td className="px-1 py-1">
                      <MemberChipSelector selected={row.members.ministry_team} allMembers={allMembers} onAdd={(m) => addNewRowMember(row.key, "ministry_team", m)} onRemove={(id) => removeNewRowMember(row.key, "ministry_team", id)} editing chipColorClass={roleChipColor.ministry_team} />
                    </td>
                    <td className="px-1 py-1">
                      <input value={row.name} onChange={(e) => updateNewRowName(row.key, e.target.value)} className={addInputClass} placeholder="다코방 이름" />
                    </td>
                    <td className="px-1 py-1">
                      <MemberChipSelector selected={row.members.leader} allMembers={allMembers} onAdd={(m) => addNewRowMember(row.key, "leader", m)} onRemove={(id) => removeNewRowMember(row.key, "leader", id)} editing chipColorClass={roleChipColor.leader} />
                    </td>
                    <td className="px-1 py-1">
                      <MemberChipSelector selected={row.members.sub_leader} allMembers={allMembers} onAdd={(m) => addNewRowMember(row.key, "sub_leader", m)} onRemove={(id) => removeNewRowMember(row.key, "sub_leader", id)} editing chipColorClass={roleChipColor.sub_leader} />
                    </td>
                    <td className="px-1 py-1">
                      <MemberChipSelector selected={row.members.member} allMembers={allMembers} onAdd={(m) => addNewRowMember(row.key, "member", m)} onRemove={(id) => removeNewRowMember(row.key, "member", id)} editing chipColorClass={roleChipColor.member} />
                    </td>
                  </tr>
                ))}
                </Fragment>
              );
            })}

            {/* 새 행 중 담당장로 미지정 또는 매칭 안 된 것 */}
            {bulkEditing && (() => {
              const existingTeamKeys = new Set(displayFiltered.map(getTeamKey).filter(Boolean));
              return newRows
                .filter((row) => {
                  const k = row.members.ministry_team.map((m) => m.id).sort().join(",");
                  return !k || !existingTeamKeys.has(k);
                })
                .map((row) => (
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
                  <MemberChipSelector selected={row.members.ministry_team} allMembers={allMembers} onAdd={(m) => addNewRowMember(row.key, "ministry_team", m)} onRemove={(id) => removeNewRowMember(row.key, "ministry_team", id)} editing chipColorClass={roleChipColor.ministry_team} />
                </td>
                <td className="px-1 py-1">
                  <input value={row.name} onChange={(e) => updateNewRowName(row.key, e.target.value)} className={addInputClass} placeholder="다코방 이름" />
                </td>
                <td className="px-1 py-1">
                  <MemberChipSelector selected={row.members.leader} allMembers={allMembers} onAdd={(m) => addNewRowMember(row.key, "leader", m)} onRemove={(id) => removeNewRowMember(row.key, "leader", id)} editing chipColorClass={roleChipColor.leader} />
                </td>
                <td className="px-1 py-1">
                  <MemberChipSelector selected={row.members.sub_leader} allMembers={allMembers} onAdd={(m) => addNewRowMember(row.key, "sub_leader", m)} onRemove={(id) => removeNewRowMember(row.key, "sub_leader", id)} editing chipColorClass={roleChipColor.sub_leader} />
                </td>
                <td className="px-1 py-1">
                  <MemberChipSelector selected={row.members.member} allMembers={allMembers} onAdd={(m) => addNewRowMember(row.key, "member", m)} onRemove={(id) => removeNewRowMember(row.key, "member", id)} editing chipColorClass={roleChipColor.member} />
                </td>
              </tr>
                ));
            })()}

            {displayFiltered.length === 0 && newRows.length === 0 && (
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
