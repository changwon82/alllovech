"use client";

import { useState, useTransition } from "react";
import {
  createGroup,
  updateGroup,
  toggleGroupActive,
  addMember,
  updateMemberRole,
  removeMember,
} from "./actions";

type Member = { userId: string; name: string; role: string };
type Group = {
  id: string;
  name: string;
  type: string;
  description: string;
  isActive: boolean;
  parentId: string | null;
  members: Member[];
};
type UserOption = { id: string; name: string; status: string };

const TYPE_LABEL: Record<string, string> = {
  ministry: "사역",
  group: "그룹",
};

// --------------- 그룹 생성/수정 폼 ---------------
function GroupForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { name: string; type: string; description: string; parentId: string | null };
  onSave: (name: string, type: "ministry" | "group", description: string, parentId: string | null) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"ministry" | "group">((initial?.type as "ministry" | "group") ?? "group");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="그룹 이름"
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy/30"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "ministry" | "group")}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none"
        >
          <option value="ministry">사역</option>
          <option value="group">그룹</option>
        </select>
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="설명 (선택)"
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy/30"
      />
      <div className="flex gap-2">
        <button
          onClick={() => name.trim() && onSave(name.trim(), type, description.trim(), null)}
          disabled={!name.trim()}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          저장
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-500 transition-all hover:bg-neutral-50"
        >
          취소
        </button>
      </div>
    </div>
  );
}

// --------------- 멤버 추가 ---------------
function AddMemberSelect({
  users,
  existingIds,
  onAdd,
}: {
  users: UserOption[];
  existingIds: Set<string>;
  onAdd: (userId: string, role: "leader" | "member") => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const available = users.filter((u) => !existingIds.has(u.id));

  if (available.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="flex-1 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs outline-none"
      >
        <option value="">멤버 추가...</option>
        {available.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      {selectedId && (
        <>
          <button
            onClick={() => { onAdd(selectedId, "member"); setSelectedId(""); }}
            className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            성도
          </button>
          <button
            onClick={() => { onAdd(selectedId, "leader"); setSelectedId(""); }}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            리더
          </button>
        </>
      )}
    </div>
  );
}

// --------------- 메인 컴포넌트 ---------------
export default function GroupManager({
  groups: initialGroups,
  allUsers,
}: {
  groups: Group[];
  allUsers: UserOption[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const selected = groups.find((g) => g.id === selectedId);

  // 그룹 생성
  function handleCreate(name: string, type: "ministry" | "group", description: string, parentId: string | null) {
    startTransition(async () => {
      const result = await createGroup(name, type, description, parentId);
      if ("id" in result) {
        const newGroup: Group = {
          id: result.id as string,
          name,
          type,
          description,
          isActive: true,
          parentId,
          members: [],
        };
        setGroups((prev) => [...prev, newGroup]);
        setSelectedId(newGroup.id);
        setShowCreate(false);
      }
    });
  }

  // 그룹 수정
  function handleUpdate(groupId: string, name: string, type: "ministry" | "group", description: string) {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name, type, description } : g)));
    setEditingId(null);
    startTransition(async () => {
      const result = await updateGroup(groupId, name, type, description);
      if ("error" in result) {
        // 롤백은 생략 — 새로고침으로 복구
      }
    });
  }

  // 활성/비활성
  function handleToggleActive(groupId: string, isActive: boolean) {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, isActive } : g)));
    startTransition(async () => {
      await toggleGroupActive(groupId, isActive);
    });
  }

  // 멤버 추가
  function handleAddMember(groupId: string, userId: string, role: "leader" | "member") {
    const userName = allUsers.find((u) => u.id === userId)?.name ?? "이름 없음";
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, members: [...g.members, { userId, name: userName, role }] }
          : g
      )
    );
    startTransition(async () => {
      await addMember(groupId, userId, role);
    });
  }

  // 멤버 역할 변경
  function handleRoleChange(groupId: string, userId: string, role: "leader" | "member") {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, members: g.members.map((m) => (m.userId === userId ? { ...m, role } : m)) }
          : g
      )
    );
    startTransition(async () => {
      await updateMemberRole(groupId, userId, role);
    });
  }

  // 멤버 제거
  function handleRemoveMember(groupId: string, userId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, members: g.members.filter((m) => m.userId !== userId) }
          : g
      )
    );
    startTransition(async () => {
      await removeMember(groupId, userId);
    });
  }

  return (
    <div className="flex gap-6">
      {/* 좌측: 그룹 목록 */}
      <div className="w-72 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-700">함께읽기 그룹</h3>
          <button
            onClick={() => { setShowCreate(true); setSelectedId(null); setEditingId(null); }}
            className="rounded-lg bg-navy px-3 py-1 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            + 새 그룹
          </button>
        </div>

        <div className="mt-3 space-y-1">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => { setSelectedId(g.id); setShowCreate(false); setEditingId(null); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                selectedId === g.id
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white text-neutral-700 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="min-w-0">
                <span className={`font-medium ${!g.isActive ? "line-through opacity-50" : ""}`}>{g.name}</span>
                <span className={`ml-1.5 text-[10px] ${selectedId === g.id ? "text-white/60" : "text-neutral-400"}`}>
                  {TYPE_LABEL[g.type] ?? g.type}
                </span>
              </div>
              <span className={`text-xs ${selectedId === g.id ? "text-white/60" : "text-neutral-400"}`}>
                {g.members.length}명
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 우측: 상세 */}
      <div className="flex-1">
        {showCreate && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-neutral-800">새 그룹 만들기</h3>
            <div className="mt-4">
              <GroupForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
            </div>
          </div>
        )}

        {selected && !showCreate && (
          <div className="space-y-4">
            {/* 그룹 정보 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              {editingId === selected.id ? (
                <>
                  <h3 className="mb-4 text-base font-semibold text-neutral-800">그룹 수정</h3>
                  <GroupForm
                    initial={{ name: selected.name, type: selected.type, description: selected.description, parentId: selected.parentId }}
                    onSave={(name, type, desc) => handleUpdate(selected.id, name, type, desc)}
                    onCancel={() => setEditingId(null)}
                  />
                </>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-neutral-800">{selected.name}</h3>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                        {TYPE_LABEL[selected.type] ?? selected.type}
                      </span>
                      {!selected.isActive && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-400">
                          비활성
                        </span>
                      )}
                    </div>
                    {selected.description && (
                      <p className="mt-1 text-sm text-neutral-500">{selected.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(selected.id)}
                      className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 transition-all hover:bg-neutral-50"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleToggleActive(selected.id, !selected.isActive)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        selected.isActive
                          ? "border border-red-200 text-red-400 hover:bg-red-50"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {selected.isActive ? "비활성화" : "활성화"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 멤버 관리 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-700">멤버 ({selected.members.length}명)</h3>
              </div>

              <div className="mt-3">
                <AddMemberSelect
                  users={allUsers}
                  existingIds={new Set(selected.members.map((m) => m.userId))}
                  onAdd={(userId, role) => handleAddMember(selected.id, userId, role)}
                />
              </div>

              {selected.members.length > 0 ? (
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left text-xs font-medium text-neutral-500">
                      <th className="py-2">이름</th>
                      <th className="py-2">역할</th>
                      <th className="py-2 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.members
                      .sort((a, b) => (a.role === "leader" ? -1 : 1) - (b.role === "leader" ? -1 : 1) || a.name.localeCompare(b.name, "ko"))
                      .map((m) => (
                        <tr key={m.userId} className="border-b border-neutral-50 last:border-b-0">
                          <td className="py-2 font-medium text-neutral-800">{m.name}</td>
                          <td className="py-2">
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(selected.id, m.userId, e.target.value as "leader" | "member")}
                              className={`rounded-lg border px-2 py-1 text-xs outline-none ${
                                m.role === "leader"
                                  ? "border-accent/30 bg-accent-light text-accent"
                                  : "border-neutral-200 text-neutral-500"
                              }`}
                            >
                              <option value="member">성도</option>
                              <option value="leader">리더</option>
                            </select>
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => handleRemoveMember(selected.id, m.userId)}
                              className="text-xs text-neutral-400 hover:text-red-500"
                            >
                              제거
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-4 text-center text-xs text-neutral-400">멤버가 없습니다</p>
              )}
            </div>
          </div>
        )}

        {!selected && !showCreate && (
          <div className="flex h-48 items-center justify-center text-sm text-neutral-400">
            좌측에서 그룹을 선택하거나 새 그룹을 만드세요
          </div>
        )}
      </div>
    </div>
  );
}
