"use client";

import { useState, useTransition } from "react";
import { updateUserStatus, addUserRole, removeUserRole } from "./actions";

const ALL_ROLES = [
  "ADMIN", "PASTOR", "STAFF", "EDU_MINISTER",
  "DISTRICT_LEADER", "GROUP_LEADER", "DEACON", "TEACHER", "MEMBER",
];

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  active: "활성",
  inactive: "비활성",
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "관리자",
  PASTOR: "목회자",
  STAFF: "직원",
  EDU_MINISTER: "교육부 교역자",
  DISTRICT_LEADER: "교구장",
  GROUP_LEADER: "소그룹장",
  DEACON: "집사",
  TEACHER: "교사",
  MEMBER: "성도",
};

type User = {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  created_at: string;
  roles: string[];
};

function UserRow({
  user,
  onStatusChange,
  onAddRole,
  onRemoveRole,
}: {
  user: User;
  onStatusChange: (userId: string, status: "active" | "pending" | "inactive") => void;
  onAddRole: (userId: string, role: string) => void;
  onRemoveRole: (userId: string, role: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showRoles, setShowRoles] = useState(false);

  const availableRoles = ALL_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <div className={`rounded-2xl p-4 shadow-sm ${user.status === "pending" ? "bg-accent-light" : "bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-neutral-800">{user.name}</p>
          {user.phone && <p className="text-xs text-neutral-400">{user.phone}</p>}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={user.status}
            onChange={(e) => onStatusChange(user.id, e.target.value as "active" | "pending" | "inactive")}
            disabled={isPending}
            className={`rounded-lg border px-2 py-1 text-xs outline-none ${
              user.status === "active"
                ? "border-green-200 bg-green-50 text-green-700"
                : user.status === "pending"
                  ? "border-accent/30 bg-accent-light text-accent"
                  : "border-neutral-200 text-neutral-500"
            }`}
          >
            <option value="pending">{STATUS_LABEL.pending}</option>
            <option value="active">{STATUS_LABEL.active}</option>
            <option value="inactive">{STATUS_LABEL.inactive}</option>
          </select>
        </div>
      </div>

      {/* 역할 */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {user.roles.map((role) => (
          <span
            key={role}
            className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2 py-0.5 text-xs text-navy"
          >
            {ROLE_LABEL[role] ?? role}
            <button
              onClick={() => onRemoveRole(user.id, role)}
              disabled={isPending}
              className="text-navy/50 hover:text-red-500"
            >
              x
            </button>
          </span>
        ))}
        <button
          onClick={() => setShowRoles(!showRoles)}
          className="rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-xs text-neutral-400 hover:border-navy hover:text-navy"
        >
          + 역할
        </button>
      </div>

      {showRoles && availableRoles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {availableRoles.map((role) => (
            <button
              key={role}
              onClick={() => { onAddRole(user.id, role); setShowRoles(false); }}
              disabled={isPending}
              className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-500 hover:border-navy hover:text-navy"
            >
              {ROLE_LABEL[role] ?? role}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserList({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "inactive">("all");
  const [, startTransition] = useTransition();

  const filtered = users.filter((u) => {
    if (filter === "pending") return u.status === "pending";
    if (filter === "active") return u.status === "active";
    if (filter === "inactive") return u.status === "inactive";
    return true;
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const activeCount = users.filter((u) => u.status === "active").length;
  const inactiveCount = users.filter((u) => u.status === "inactive").length;

  function handleStatusChange(userId: string, status: "active" | "pending" | "inactive") {
    const prev = users.find((u) => u.id === userId)?.status;
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status } : u));
    startTransition(async () => {
      const result = await updateUserStatus(userId, status);
      if ("error" in result) {
        setUsers((all) => all.map((u) => u.id === userId ? { ...u, status: prev ?? "pending" } : u));
      }
    });
  }

  function handleAddRole(userId: string, role: string) {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, roles: [...u.roles, role] } : u));
    startTransition(async () => {
      const result = await addUserRole(userId, role);
      if ("error" in result) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, roles: u.roles.filter((r) => r !== role) } : u));
      }
    });
  }

  function handleRemoveRole(userId: string, role: string) {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, roles: u.roles.filter((r) => r !== role) } : u));
    startTransition(async () => {
      const result = await removeUserRole(userId, role);
      if ("error" in result) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, roles: [...u.roles, role] } : u));
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["all", "pending", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              filter === f
                ? "bg-navy text-white"
                : "bg-white text-neutral-500 shadow-sm hover:shadow-md"
            }`}
          >
            {f === "all"
              ? `전체 (${users.length})`
              : f === "pending"
                ? `대기 (${pendingCount})`
                : f === "active"
                  ? `활성 (${activeCount})`
                  : `비활성 (${inactiveCount})`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            onStatusChange={handleStatusChange}
            onAddRole={handleAddRole}
            onRemoveRole={handleRemoveRole}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-400">사용자가 없습니다</p>
        )}
      </div>
    </div>
  );
}
