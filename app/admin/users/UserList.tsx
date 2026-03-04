"use client";

import { useMemo, useState, useTransition } from "react";
import { updateUserStatus, addUserRole, removeUserRole } from "./actions";
import Avatar from "@/app/components/ui/Avatar";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  active: "활성",
  inactive: "비활성",
};

type SortKey = "name" | "email" | "status" | "admin" | "created_at";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = { pending: 0, active: 1, inactive: 2 };

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-block text-[10px] ${active ? "text-navy" : "text-neutral-300"}`}>
      {active ? (dir === "asc" ? "▲" : "▼") : "▲"}
    </span>
  );
}

type User = {
  id: string;
  name: string;
  email: string | null;
  providers: string[];
  phone: string | null;
  status: string;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
};

function ProviderBadge({ provider }: { provider: string }) {
  if (provider === "email")
    return (
      <span className="inline-flex items-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
        이메일
      </span>
    );
  if (provider === "kakao")
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-300 px-1.5 py-0.5 text-[10px] font-medium text-yellow-900">
        카톡
      </span>
    );
  return null;
}

function AdminToggle({
  isAdmin,
  onToggle,
  disabled,
}: {
  isAdmin: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        isAdmin ? "bg-navy" : "bg-neutral-300"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          isAdmin ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function StatusSelect({
  status,
  onChange,
  disabled,
}: {
  status: string;
  onChange: (s: "active" | "pending" | "inactive") => void;
  disabled: boolean;
}) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as "active" | "pending" | "inactive")}
      disabled={disabled}
      className={`rounded-lg border px-2 py-1 text-xs outline-none ${
        status === "active"
          ? "border-green-200 bg-green-50 text-green-700"
          : status === "pending"
            ? "border-accent/30 bg-accent-light text-accent"
            : "border-neutral-200 text-neutral-500"
      }`}
    >
      <option value="pending">{STATUS_LABEL.pending}</option>
      <option value="active">{STATUS_LABEL.active}</option>
      <option value="inactive">{STATUS_LABEL.inactive}</option>
    </select>
  );
}

export default function UserList({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [, startTransition] = useTransition();

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let list = users.filter((u) => {
      if (filter === "pending" && u.status !== "pending") return false;
      if (filter === "active" && u.status !== "active") return false;
      if (filter === "inactive" && u.status !== "inactive") return false;
      if (search) {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || (u.email?.toLowerCase().includes(q) ?? false);
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name, "ko");
          break;
        case "email":
          cmp = (a.email ?? "").localeCompare(b.email ?? "", "ko");
          break;
        case "status":
          cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
          break;
        case "admin":
          cmp = (a.roles.includes("ADMIN") ? 0 : 1) - (b.roles.includes("ADMIN") ? 0 : 1);
          break;
        case "created_at":
          cmp = a.created_at.localeCompare(b.created_at);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [users, filter, search, sortKey, sortDir]);

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const activeCount = users.filter((u) => u.status === "active").length;
  const inactiveCount = users.filter((u) => u.status === "inactive").length;

  function handleStatusChange(userId: string, status: "active" | "pending" | "inactive") {
    const prev = users.find((u) => u.id === userId)?.status;
    setUsers((all) => all.map((u) => (u.id === userId ? { ...u, status } : u)));
    startTransition(async () => {
      const result = await updateUserStatus(userId, status);
      if ("error" in result) {
        setUsers((all) => all.map((u) => (u.id === userId ? { ...u, status: prev ?? "pending" } : u)));
      }
    });
  }

  function handleToggleAdmin(userId: string, currentlyAdmin: boolean) {
    if (currentlyAdmin) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roles: u.roles.filter((r) => r !== "ADMIN") } : u)));
      startTransition(async () => {
        const result = await removeUserRole(userId, "ADMIN");
        if ("error" in result) {
          setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roles: [...u.roles, "ADMIN"] } : u)));
        }
      });
    } else {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roles: [...u.roles, "ADMIN"] } : u)));
      startTransition(async () => {
        const result = await addUserRole(userId, "ADMIN");
        if ("error" in result) {
          setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roles: u.roles.filter((r) => r !== "ADMIN") } : u)));
        }
      });
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  return (
    <div>
      {/* 필터 탭 + 검색 */}
      <div className="mb-4 flex items-center gap-2">
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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 또는 이메일 검색"
          className="ml-auto rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-navy/30"
        />
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-medium text-neutral-500">
              <th className="px-4 py-3 text-center w-10">#</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("name")}>
                이름<SortIcon active={sortKey === "name"} dir={sortDir} />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("email")}>
                이메일<SortIcon active={sortKey === "email"} dir={sortDir} />
              </th>
              <th className="px-4 py-3">인증</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("status")}>
                상태<SortIcon active={sortKey === "status"} dir={sortDir} />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("admin")}>
                관리자<SortIcon active={sortKey === "admin"} dir={sortDir} />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                가입일<SortIcon active={sortKey === "created_at"} dir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const isAdmin = u.roles.includes("ADMIN");
              return (
                <tr
                  key={u.id}
                  className={`border-b border-neutral-50 transition-colors last:border-b-0 ${
                    u.status === "pending" ? "bg-accent-light/50" : "hover:bg-neutral-50"
                  }`}
                >
                  {/* 번호 */}
                  <td className="px-4 py-3 text-center text-xs text-neutral-400">{i + 1}</td>

                  {/* 이름 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar avatarUrl={u.avatar_url} name={u.name} seed={u.id} size="sm" />
                      <span className="font-medium text-neutral-800">{u.name}</span>
                    </div>
                  </td>

                  {/* 이메일 */}
                  <td className="px-4 py-3 text-neutral-500">
                    {u.email ?? <span className="text-neutral-300">—</span>}
                  </td>

                  {/* 인증 */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.providers.map((p) => (
                        <ProviderBadge key={p} provider={p} />
                      ))}
                      {u.providers.length === 0 && <span className="text-neutral-300">—</span>}
                    </div>
                  </td>

                  {/* 상태 */}
                  <td className="px-4 py-3">
                    <StatusSelect
                      status={u.status}
                      onChange={(s) => handleStatusChange(u.id, s)}
                      disabled={false}
                    />
                  </td>

                  {/* 관리자 */}
                  <td className="px-4 py-3">
                    <AdminToggle
                      isAdmin={isAdmin}
                      onToggle={() => handleToggleAdmin(u.id, isAdmin)}
                      disabled={false}
                    />
                  </td>

                  {/* 가입일 */}
                  <td className="px-4 py-3 text-neutral-400">
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-400">사용자가 없습니다</p>
        )}
      </div>
    </div>
  );
}
