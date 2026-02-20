"use client";

import { useState, useTransition } from "react";
import { createGroup, updateGroup, addGroupMember, removeGroupMember } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  small_group: "소그룹", district: "교구", department: "부서", edu_class: "반", one_on_one: "일대일",
};
const MEMBER_ROLE_LABEL: Record<string, string> = {
  leader: "그룹장", sub_leader: "부그룹장", teacher: "교사", deacon: "집사", member: "멤버",
};

type GroupMember = { user_id: string; role: string; name: string };
type Group = {
  id: string; name: string; type: string; description: string | null;
  is_active: boolean; members: GroupMember[];
};
type SimpleUser = { id: string; name: string };

function GroupCard({
  group: initial,
  allUsers,
}: {
  group: Group;
  allUsers: SimpleUser[];
}) {
  const [group, setGroup] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState("member");
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editName, setEditName] = useState(initial.name);
  const [editDesc, setEditDesc] = useState(initial.description ?? "");
  const [editActive, setEditActive] = useState(initial.is_active);

  const memberIds = new Set(group.members.map((m) => m.user_id));
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));

  function handleAddMember() {
    if (!addUserId) return;
    const userName = allUsers.find((u) => u.id === addUserId)?.name ?? "이름 없음";
    setGroup((g) => ({
      ...g,
      members: [...g.members, { user_id: addUserId, role: addRole, name: userName }],
    }));
    const uid = addUserId;
    const role = addRole;
    setAddUserId("");
    startTransition(async () => {
      const result = await addGroupMember(group.id, uid, role);
      if ("error" in result) window.location.reload();
    });
  }

  function handleRemoveMember(userId: string) {
    setGroup((g) => ({ ...g, members: g.members.filter((m) => m.user_id !== userId) }));
    startTransition(async () => {
      const result = await removeGroupMember(group.id, userId);
      if ("error" in result) window.location.reload();
    });
  }

  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm ${!group.is_active ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(!expanded)} className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-neutral-800">{group.name}</h3>
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
              {TYPE_LABEL[group.type] ?? group.type}
            </span>
            <span className="text-xs text-neutral-400">{group.members.length}명</span>
          </div>
        </button>
        <span className="text-xs text-neutral-300">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* 그룹 수정 */}
          {isEditingGroup ? (
            <div className="space-y-2 rounded-xl bg-neutral-50 p-3">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="그룹 이름"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy"
              />
              <input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="설명 (선택)"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                <span className="text-xs text-neutral-600">활성</span>
              </label>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setIsEditingGroup(false); setEditName(group.name); setEditDesc(group.description ?? ""); setEditActive(group.is_active); }}
                  className="text-xs text-neutral-500 hover:bg-neutral-100 rounded-lg px-3 py-1.5"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (!editName.trim()) return;
                    startTransition(async () => {
                      const result = await updateGroup(group.id, editName.trim(), editDesc.trim(), editActive);
                      if ("success" in result) {
                        setGroup((g) => ({
                          ...g,
                          name: editName.trim(),
                          description: editDesc.trim() || null,
                          is_active: editActive,
                        }));
                        setIsEditingGroup(false);
                      }
                    });
                  }}
                  disabled={isPending || !editName.trim()}
                  className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditingGroup(true)}
                className="text-xs text-neutral-400 hover:text-navy"
              >
                그룹 수정
              </button>
            </div>
          )}

          {/* 멤버 목록 */}
          <div className="space-y-1">
            {group.members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-700">{m.name}</span>
                  <span className="text-xs text-neutral-400">{MEMBER_ROLE_LABEL[m.role] ?? m.role}</span>
                </div>
                <button
                  onClick={() => handleRemoveMember(m.user_id)}
                  disabled={isPending}
                  className="text-xs text-neutral-300 hover:text-red-500"
                >
                  제거
                </button>
              </div>
            ))}
          </div>

          {/* 멤버 추가 */}
          <div className="flex gap-2">
            <select
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs outline-none"
            >
              <option value="">사용자 선택...</option>
              {nonMembers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value)}
              className="w-24 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs outline-none"
            >
              {Object.entries(MEMBER_ROLE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button
              onClick={handleAddMember}
              disabled={isPending || !addUserId}
              className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupManager({
  groups: initialGroups,
  allUsers,
}: {
  groups: Group[];
  allUsers: SimpleUser[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("small_group");
  const [newDesc, setNewDesc] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createGroup(newName.trim(), newType, newDesc.trim());
      if ("error" in result) {
        alert(`그룹 생성 실패: ${result.error}`);
        return;
      }
      if ("groupId" in result) {
        setGroups((g) => [...g, {
          id: result.groupId as string,
          name: newName.trim(),
          type: newType,
          description: newDesc.trim() || null,
          is_active: true,
          members: [],
        }]);
        setNewName("");
        setNewDesc("");
        setShowCreate(false);
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{groups.length}개 그룹</p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-xl bg-navy px-4 py-2 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          + 그룹 생성
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 rounded-2xl bg-accent-light p-4 space-y-2 shadow-sm">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="그룹 이름"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy"
          />
          <div className="flex gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="rounded-lg border border-neutral-200 px-2 py-2 text-sm outline-none"
            >
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="설명 (선택)"
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs text-neutral-500">취소</button>
            <button
              onClick={handleCreate}
              disabled={isPending || !newName.trim()}
              className="rounded-lg bg-navy px-4 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              생성
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} allUsers={allUsers} />
        ))}
      </div>
    </div>
  );
}
