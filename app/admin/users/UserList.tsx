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

function UserRow({ user: initial }: { user: User }) {
  const [user, setUser] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [showRoles, setShowRoles] = useState(false);

  function handleStatusChange(status: "active" | "pending" | "inactive") {
    const prev = user.status;
    setUser((u) => ({ ...u, status }));
    startTransition(async () => {
      const result = await updateUserStatus(user.id, status);
      if ("error" in result) setUser((u) => ({ ...u, status: prev }));
    });
  }

  function handleAddRole(role: string) {
    setUser((u) => ({ ...u, roles: [...u.roles, role] }));
    startTransition(async () => {
      const result = await addUserRole(user.id, role);
      if ("error" in result) setUser((u) => ({ ...u, roles: u.roles.filter((r) => r !== role) }));
    });
  }

  function handleRemoveRole(role: string) {
    setUser((u) => ({ ...u, roles: u.roles.filter((r) => r !== role) }));
    startTransition(async () => {
      const result = await removeUserRole(user.id, role);
      if ("error" in result) setUser((u) => ({ ...u, roles: [...u.roles, role] }));
    });
  }

  const availableRoles = ALL_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <div className={`rounded-xl border p-4 ${user.status === "pending" ? "border-blue/30 bg-blue/5" : "border-neutral-200"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-neutral-800">{user.name}</p>
          {user.phone && <p className="text-xs text-neutral-400">{user.phone}</p>}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={user.status}
            onChange={(e) => handleStatusChange(e.target.value as "active" | "pending" | "inactive")}
            disabled={isPending}
            className={`rounded-lg border px-2 py-1 text-xs outline-none ${
              user.status === "active"
                ? "border-green-200 bg-green-50 text-green-700"
                : user.status === "pending"
                  ? "border-blue/20 bg-blue/5 text-blue"
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
              onClick={() => handleRemoveRole(role)}
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
              onClick={() => { handleAddRole(role); setShowRoles(false); }}
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

export default function UserList({ users }: { users: User[] }) {
  const [filter, setFilter] = useState<"all" | "pending" | "active">("all");

  const filtered = users.filter((u) => {
    if (filter === "pending") return u.status === "pending";
    if (filter === "active") return u.status === "active";
    return true;
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["all", "pending", "active"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f
                ? "bg-navy text-white"
                : "border border-neutral-200 text-neutral-500 hover:border-neutral-400"
            }`}
          >
            {f === "all" ? `전체 (${users.length})` : f === "pending" ? `대기 (${pendingCount})` : "활성"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-400">사용자가 없습니다</p>
        )}
      </div>
    </div>
  );
}
