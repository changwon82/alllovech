"use client";

import { useState, useTransition } from "react";
import {
  createGroup,
  updateGroup,
  deleteGroup,
  archiveGroup,
  restoreGroup,
  getGroupStats,
  approveGroup,
  rejectGroup,
  addMember,
  updateMemberRole,
  removeMember,
  createGroupInvite,
} from "./actions";

type Member = { userId: string; name: string; role: string };
type Group = {
  id: string;
  name: string;
  type: string;
  description: string;
  parentId: string | null;
  isActive: boolean;
  status: "pending" | "approved" | "rejected";
  createdBy: string | null;
  startDate: string | null;
  endDate: string | null;
  members: Member[];
  dakobangLeaders: string[];
  contentType: string;
};
type UserOption = { id: string; name: string; status: string };

const TYPE_LABEL: Record<string, string> = {
  dakobang: "다코방",
  family: "가족",
  free: "자유",
};

const CONTENT_LABEL: Record<string, string> = {
  "365bible": "365 성경읽기",
};

type DisplayStatus = "pending" | "active" | "archived" | "rejected";

function getDisplayStatus(g: Group): DisplayStatus {
  if (g.status === "pending") return "pending";
  if (g.status === "rejected") return "rejected";
  return g.isActive ? "active" : "archived";
}

const STATUS_BADGE: Record<DisplayStatus, { label: string; className: string }> = {
  pending: { label: "승인 대기", className: "bg-accent/15 text-accent" },
  active: { label: "활성", className: "bg-green-50 text-green-600" },
  archived: { label: "보관", className: "bg-neutral-100 text-neutral-400" },
  rejected: { label: "거절됨", className: "bg-red-50 text-red-500" },
};

// 정렬 순서: pending → active → archived → rejected
const STATUS_ORDER: Record<DisplayStatus, number> = {
  pending: 0,
  active: 1,
  archived: 2,
  rejected: 3,
};

function formatPeriod(start: string | null, end: string | null) {
  if (!start || !end) return "-";
  return `${start.slice(0, 7).replace("-", ".")} ~ ${end.slice(0, 7).replace("-", ".")}`;
}

// --------------- 그룹 생성/수정 폼 ---------------
function GroupForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { name: string; type: string; description: string; parentId: string | null };
  onSave: (name: string, type: "dakobang" | "family" | "free", description: string, parentId: string | null) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"dakobang" | "family" | "free">((initial?.type as "dakobang" | "family" | "free") ?? "dakobang");
  const [description, setDescription] = useState(initial?.description ?? "");

  const inputClass = "rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs outline-none focus:border-navy/30";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="그룹 이름"
        className={`w-36 ${inputClass}`}
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as "dakobang" | "family" | "free")}
        className={inputClass}
      >
        <option value="dakobang">다코방</option>
        <option value="family">가족</option>
        <option value="free">자유</option>
      </select>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="설명 (선택)"
        className={`w-40 ${inputClass}`}
      />
      <button
        onClick={() => name.trim() && onSave(name.trim(), type, description.trim(), null)}
        disabled={!name.trim()}
        className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
      >
        저장
      </button>
      <button
        onClick={onCancel}
        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 transition-all hover:bg-neutral-50"
      >
        취소
      </button>
    </div>
  );
}

// --------------- 멤버 추가 (검색) ---------------
function AddMemberSearch({
  users,
  existingIds,
  onAdd,
}: {
  users: UserOption[];
  existingIds: Set<string>;
  onAdd: (userId: string, role: "leader" | "member") => void;
}) {
  const [query, setQuery] = useState("");
  const available = users.filter((u) => !existingIds.has(u.id));
  const filtered = query.trim()
    ? available.filter((u) => u.name.includes(query.trim()))
    : [];

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 검색..."
        className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs outline-none focus:border-navy/30"
      />
      {filtered.length > 0 && (
        <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
          {filtered.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-2.5 py-1.5 hover:bg-neutral-50">
              <span className="text-xs text-neutral-700">{u.name}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => { onAdd(u.id, "member"); setQuery(""); }}
                  className="rounded-md bg-navy px-2 py-0.5 text-[11px] font-medium text-white transition-all hover:brightness-110 active:scale-95"
                >
                  방원
                </button>
                <button
                  onClick={() => { onAdd(u.id, "leader"); setQuery(""); }}
                  className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-white transition-all hover:brightness-110 active:scale-95"
                >
                  방장
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {query.trim() && filtered.length === 0 && (
        <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 shadow-lg">
          <span className="text-xs text-neutral-400">검색 결과 없음</span>
        </div>
      )}
    </div>
  );
}

// --------------- 초대 링크 섹션 ---------------
function InviteLinkSection({ groupId }: { groupId: string }) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setLoading(true);
    setError("");
    const result = await createGroupInvite(groupId);
    if ("code" in result) {
      setInviteCode(result.code as string);
    } else if ("error" in result) {
      setError(result.error as string);
    }
    setLoading(false);
  }

  async function handleCreateAndCopy() {
    setLoading(true);
    setError("");
    const result = await createGroupInvite(groupId);
    if ("code" in result) {
      const code = result.code as string;
      setInviteCode(code);
      const url = `${window.location.origin}/365bible/invite/${code}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if ("error" in result) {
      setError(result.error as string);
    }
    setLoading(false);
  }

  function handleCopy() {
    if (!inviteCode) return;
    const url = `${window.location.origin}/365bible/invite/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3">
      <span className="text-xs font-semibold text-neutral-500">초대 링크</span>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!inviteCode ? (
        <button
          onClick={handleCreateAndCopy}
          disabled={loading}
          className="ml-2 rounded-lg bg-navy px-2.5 py-1 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {loading ? "생성 중..." : "초대 링크 생성"}
        </button>
      ) : (
        <div className="mt-1.5 flex items-center gap-2">
          <code className="rounded-lg bg-white px-2.5 py-1.5 text-xs text-neutral-600 shadow-sm">
            {`${typeof window !== "undefined" ? window.location.origin : ""}/365bible/invite/${inviteCode}`}
          </code>
          <button
            onClick={handleCopy}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all active:scale-95 ${
              copied
                ? "bg-green-50 text-green-600"
                : "bg-navy text-white hover:brightness-110"
            }`}
          >
            {copied ? "복사 완료!" : "복사"}
          </button>
        </div>
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

  // 정렬: pending → active → archived → rejected
  const sortedGroups = [...groups].sort((a, b) =>
    STATUS_ORDER[getDisplayStatus(a)] - STATUS_ORDER[getDisplayStatus(b)]
  );

  // 그룹 생성
  function handleCreate(name: string, type: "dakobang" | "family" | "free", description: string, parentId: string | null) {
    startTransition(async () => {
      const result = await createGroup(name, type, description, parentId);
      if ("id" in result) {
        const newGroup: Group = {
          id: result.id as string,
          name,
          type,
          description,
          parentId,
          isActive: true,
          status: "approved",
          createdBy: null,
          startDate: null,
          endDate: null,
          members: [],
          dakobangLeaders: [],
          contentType: "365bible",
        };
        setGroups((prev) => [...prev, newGroup]);
        setSelectedId(newGroup.id);
        setShowCreate(false);
      }
    });
  }

  // 그룹 수정
  function handleUpdate(groupId: string, name: string, type: "dakobang" | "family" | "free", description: string) {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name, type, description } : g)));
    setEditingId(null);
    startTransition(async () => {
      await updateGroup(groupId, name, type, description);
    });
  }

  // 승인
  function handleApprove(groupId: string) {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, status: "approved" as const } : g)));
    startTransition(async () => {
      await approveGroup(groupId);
    });
  }

  // 거절
  function handleReject(groupId: string) {
    if (!confirm("정말 거절하시겠습니까?")) return;
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, status: "rejected" as const, isActive: false } : g)));
    startTransition(async () => {
      await rejectGroup(groupId);
    });
  }

  // 보관
  function handleArchive(groupId: string) {
    if (!confirm("이 그룹을 보관하시겠습니까? 사용자 화면에서 숨겨집니다.")) return;
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, isActive: false } : g)));
    setSelectedId(null);
    startTransition(async () => {
      await archiveGroup(groupId);
    });
  }

  // 복원
  function handleRestore(groupId: string) {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, isActive: true } : g)));
    setSelectedId(null);
    startTransition(async () => {
      await restoreGroup(groupId);
    });
  }

  // 완전삭제
  async function handleDelete(groupId: string) {
    const group = groups.find((g) => g.id === groupId);
    const stats = await getGroupStats(groupId);
    if ("error" in stats) return;
    const msg = [
      `"${group?.name ?? "그룹"}" 을(를) 완전삭제하시겠습니까?`,
      ``,
      `이 그룹에 포함된 모든 데이터가 영구적으로 삭제됩니다:`,
      ``,
      `  • 참여자 ${stats.memberCount}명 — 그룹 멤버십 해제`,
      `  • 공유묵상 ${stats.shareCount}개 — 묵상 공유 기록 삭제 (개인 묵상 원본은 유지)`,
      `  • 댓글 ${stats.commentCount}개 — 묵상에 달린 댓글`,
      `  • 리액션 ${stats.reactionCount}개 — 묵상/댓글 리액션`,
      ``,
      `⚠️ 이 작업은 되돌릴 수 없습니다.`,
    ].join("\n");
    if (!confirm(msg)) return;
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setSelectedId(null);
    startTransition(async () => {
      await deleteGroup(groupId);
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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-neutral-800">함께읽기 그룹</h3>
          <p className="mt-0.5 text-sm text-neutral-400">
            요청 승인, 멤버 관리, 보관/삭제를 한 곳에서
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); setSelectedId(null); setEditingId(null); }}
          className="rounded-lg bg-navy px-3 py-1 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          + 새 그룹
        </button>
      </div>

      {showCreate && (
        <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <GroupForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      <div className="mt-4 rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
              <th className="px-4 py-2.5 font-medium">이름</th>
              <th className="px-4 py-2.5 font-medium">타입</th>
              <th className="px-4 py-2.5 font-medium">내용</th>
              <th className="px-4 py-2.5 font-medium">기간</th>
              <th className="px-4 py-2.5 font-medium">참여자</th>
              <th className="px-4 py-2.5 font-medium">상태</th>
              <th className="px-4 py-2.5 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {sortedGroups.map((g) => {
              const ds = getDisplayStatus(g);
              const badge = STATUS_BADGE[ds];
              const isSelected = selectedId === g.id;
              const isEditing = editingId === g.id;
              const dimmed = ds === "archived" || ds === "rejected";

              return (
                <GroupTableRow
                  key={g.id}
                  group={g}
                  badge={badge}
                  displayStatus={ds}
                  dimmed={dimmed}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  allUsers={allUsers}
                  onSelect={() => {}}
                  onEdit={() => { setEditingId(isEditing ? null : g.id); setSelectedId(isEditing ? null : g.id); }}
                  onCancelEdit={() => setEditingId(null)}
                  onUpdate={(name, type, desc) => handleUpdate(g.id, name, type, desc)}
                  onApprove={() => handleApprove(g.id)}
                  onReject={() => handleReject(g.id)}
                  onArchive={() => handleArchive(g.id)}
                  onRestore={() => handleRestore(g.id)}
                  onDelete={() => handleDelete(g.id)}
                  onAddMember={(userId, role) => handleAddMember(g.id, userId, role)}
                  onRoleChange={(userId, role) => handleRoleChange(g.id, userId, role)}
                  onRemoveMember={(userId) => handleRemoveMember(g.id, userId)}
                />
              );
            })}
            {sortedGroups.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                  그룹이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --------------- 테이블 행 ---------------
function GroupTableRow({
  group: g,
  badge,
  displayStatus: ds,
  dimmed,
  isSelected,
  isEditing,
  allUsers,
  onSelect,
  onEdit,
  onCancelEdit,
  onUpdate,
  onApprove,
  onReject,
  onArchive,
  onRestore,
  onDelete,
  onAddMember,
  onRoleChange,
  onRemoveMember,
}: {
  group: Group;
  badge: { label: string; className: string };
  displayStatus: DisplayStatus;
  dimmed: boolean;
  isSelected: boolean;
  isEditing: boolean;
  allUsers: UserOption[];
  onSelect: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (name: string, type: "dakobang" | "family" | "free", description: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onAddMember: (userId: string, role: "leader" | "member") => void;
  onRoleChange: (userId: string, role: "leader" | "member") => void;
  onRemoveMember: (userId: string) => void;
}) {
  return (
    <>
      <tr
        className={`border-b border-neutral-50 last:border-b-0 transition-colors ${
          isEditing ? "bg-navy/5" : dimmed ? "bg-neutral-50/50" : ""
        }`}
      >
        <td className={`px-4 py-2.5 font-medium ${dimmed ? "text-neutral-400" : "text-neutral-700"}`}>
          {g.name}
          {g.dakobangLeaders.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-neutral-400">(방장: {g.dakobangLeaders.join(", ")})</span>
          )}
        </td>
        <td className={`px-4 py-2.5 ${dimmed ? "text-neutral-400" : "text-neutral-500"}`}>
          {TYPE_LABEL[g.type] ?? g.type}
        </td>
        <td className={`px-4 py-2.5 ${dimmed ? "text-neutral-400" : "text-neutral-500"}`}>
          {CONTENT_LABEL[g.contentType] ?? g.contentType}
        </td>
        <td className={`px-4 py-2.5 ${dimmed ? "text-neutral-400" : "text-neutral-500"}`}>
          {formatPeriod(g.startDate, g.endDate)}
        </td>
        <td className={`px-4 py-2.5 ${dimmed ? "text-neutral-400" : "text-neutral-500"}`}>
          {(() => {
            const leaders = g.members.filter((m) => m.role === "leader");
            const otherCount = g.members.length - leaders.length;
            if (leaders.length === 0) return `${g.members.length}명`;
            const leaderNames = leaders.map((l) => l.name).join(", ");
            return (
              <span>
                <span className="font-medium text-accent">{leaderNames}</span>
                {otherCount > 0 && <span className="text-neutral-400"> 외 {otherCount}명</span>}
              </span>
            );
          })()}
        </td>
        <td className="px-4 py-2.5">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </td>
        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1.5">
            {ds === "pending" && (
              <>
                <button
                  onClick={onApprove}
                  className="rounded-lg bg-navy px-2.5 py-1 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
                >
                  승인
                </button>
                <button
                  onClick={onReject}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-400 transition-all hover:bg-red-50"
                >
                  거절
                </button>
              </>
            )}
            {ds === "active" && (
              <>
                <button
                  onClick={onEdit}
                  className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-500 transition-all hover:bg-neutral-50"
                >
                  수정
                </button>
                <button
                  onClick={onArchive}
                  className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs text-amber-500 transition-all hover:bg-amber-50"
                >
                  보관
                </button>
              </>
            )}
            {ds === "archived" && (
              <>
                <button
                  onClick={onRestore}
                  className="rounded-lg bg-navy px-2.5 py-1 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95"
                >
                  복원
                </button>
                <button
                  onClick={onDelete}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-400 transition-all hover:bg-red-50"
                >
                  삭제
                </button>
              </>
            )}
            {ds === "rejected" && (
              <span className="text-xs text-neutral-300">—</span>
            )}
          </div>
        </td>
      </tr>

      {/* 펼침: 수정 버튼 클릭 시에만 */}
      {isEditing && (
        <tr>
          <td colSpan={7} className="border-b border-neutral-100 bg-neutral-50/50 px-4 py-4">
            <div className="flex gap-6">
              {/* 왼쪽: 수정 폼 + 초대 링크 */}
              <div className="flex-1">
                <GroupForm
                  initial={{ name: g.name, type: g.type, description: g.description, parentId: g.parentId }}
                  onSave={(name, type, desc) => onUpdate(name, type, desc)}
                  onCancel={onCancelEdit}
                />
                {ds === "active" && <InviteLinkSection groupId={g.id} />}
              </div>
              {/* 오른쪽: 참여자 관리 */}
              <div className="w-80 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-500">참여자 ({g.members.length}명)</span>
                  {ds !== "archived" && (
                    <div className="w-48">
                      <AddMemberSearch
                        users={allUsers}
                        existingIds={new Set(g.members.map((m) => m.userId))}
                        onAdd={onAddMember}
                      />
                    </div>
                  )}
                </div>
                {g.members.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {g.members
                      .sort((a, b) => (a.role === "leader" ? -1 : 1) - (b.role === "leader" ? -1 : 1) || a.name.localeCompare(b.name, "ko"))
                      .map((m) => (
                        <div
                          key={m.userId}
                          className={`flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-xs ${
                            m.role === "leader"
                              ? "bg-accent-light text-accent"
                              : "bg-white text-neutral-600"
                          }`}
                        >
                          <span className="font-medium">{m.name}</span>
                          {ds !== "archived" ? (
                            <>
                              <select
                                value={m.role}
                                onChange={(e) => onRoleChange(m.userId, e.target.value as "leader" | "member")}
                                className="rounded bg-transparent py-0.5 text-[10px] outline-none"
                              >
                                <option value="member">방원</option>
                                <option value="leader">방장</option>
                              </select>
                              <button
                                onClick={() => onRemoveMember(m.userId)}
                                className="ml-0.5 rounded-full p-0.5 text-neutral-300 hover:bg-red-50 hover:text-red-400"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-neutral-400">
                              {m.role === "leader" ? "방장" : "방원"}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
