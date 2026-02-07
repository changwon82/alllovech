"use client";

import { useEffect, useState, useRef } from "react";
import Container from "@/src/components/Container";
import { createClient } from "@/src/lib/supabase/client";
import { ORG_TYPE_LABEL, ORG_ROLE_LABEL } from "@/src/types/database";
import type { Organization, OrgLeader } from "@/src/types/database";

const orgTypes: Organization["type"][] = ["small_group", "department", "worship"];

interface LeaderInfo {
  user_id: string;
  name: string;
  role: OrgLeader["role"];
}

interface ProfileOption {
  id: string;
  name: string;
  role: string;
}

interface OrgWithLeaders extends Organization {
  leaders: LeaderInfo[];
}

export default function AdminOrganizationsPage() {
  const supabase = useRef(createClient()).current;

  const [orgs, setOrgs] = useState<OrgWithLeaders[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<Organization["type"]>("small_group");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // 확장된 조직 ID
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 리더 추가 폼 상태
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<OrgLeader["role"]>("leader");
  const [leaderError, setLeaderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [orgsRes, leadersRes, profilesRes] = await Promise.all([
        supabase.from("organizations").select("*").order("created_at", { ascending: false }),
        supabase.from("org_leaders").select("organization_id, user_id, role"),
        supabase.from("profiles").select("id, name, role").order("name"),
      ]);

      if (cancelled) return;

      const profileList: ProfileOption[] = (profilesRes.data ?? []).map((p) => ({
        id: p.id,
        name: p.name ?? "",
        role: p.role ?? "member",
      }));
      const profileMap = new Map(profileList.map((p) => [p.id, p.name || "이름 없음"]));

      const leadersByOrg = new Map<string, LeaderInfo[]>();
      for (const l of leadersRes.data ?? []) {
        const arr = leadersByOrg.get(l.organization_id) ?? [];
        arr.push({
          user_id: l.user_id,
          name: profileMap.get(l.user_id) || "이름 없음",
          role: l.role as OrgLeader["role"],
        });
        leadersByOrg.set(l.organization_id, arr);
      }

      setOrgs(
        (orgsRes.data ?? []).map((org) => ({
          ...org,
          leaders: leadersByOrg.get(org.id) ?? [],
        })),
      );
      setProfiles(profileList);
    }

    load();
    return () => { cancelled = true; };
  }, [supabase]);

  // ── 조직 생성 ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data } = await supabase
      .from("organizations")
      .insert({ name, type, description })
      .select("*")
      .single();
    if (data) {
      setOrgs((prev) => [{ ...data, leaders: [] }, ...prev]);
    }
    setName("");
    setDescription("");
    setShowForm(false);
    setSaving(false);
  };

  // ── 조직 삭제 ──
  const handleDelete = async (id: string) => {
    if (!confirm("이 조직을 삭제하시겠습니까? 관련 명단과 출석 기록도 모두 삭제됩니다.")) return;
    await supabase.from("organizations").delete().eq("id", id);
    setOrgs((prev) => prev.filter((o) => o.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  // ── 카드 토글 ──
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setSelectedUserId("");
    setSelectedRole("leader");
    setLeaderError(null);
  };

  // ── 리더 추가 ──
  const addLeader = async (orgId: string) => {
    if (!selectedUserId) return;
    setLeaderError(null);

    const { error } = await supabase.from("org_leaders").insert({
      organization_id: orgId,
      user_id: selectedUserId,
      role: selectedRole,
    });

    if (error) {
      setLeaderError(error.code === "23505" ? "이미 등록된 리더입니다." : error.message);
      return;
    }

    const addedProfile = profiles.find((p) => p.id === selectedUserId);
    setOrgs((prev) =>
      prev.map((org) =>
        org.id === orgId
          ? {
              ...org,
              leaders: [
                ...org.leaders,
                {
                  user_id: selectedUserId,
                  name: addedProfile?.name || "이름 없음",
                  role: selectedRole,
                },
              ],
            }
          : org,
      ),
    );
    setSelectedUserId("");
  };

  // ── 리더 해제 ──
  const removeLeader = async (orgId: string, userId: string) => {
    const { error } = await supabase
      .from("org_leaders")
      .delete()
      .eq("organization_id", orgId)
      .eq("user_id", userId);

    if (error) {
      setLeaderError(error.message);
      return;
    }

    setOrgs((prev) =>
      prev.map((org) =>
        org.id === orgId
          ? { ...org, leaders: org.leaders.filter((l) => l.user_id !== userId) }
          : org,
      ),
    );
  };

  return (
    <Container as="main" size="lg" className="py-8 sm:py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">조직 관리</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            소그룹, 부서, 예배 조직을 관리하고 리더를 지정합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {showForm ? "취소" : "새 조직"}
        </button>
      </div>

      {/* 생성 폼 */}
      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div>
            <label className="mb-1.5 block text-sm font-medium">조직 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">유형</label>
            <div className="flex gap-2">
              {orgTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    type === t
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400"
                  }`}
                >
                  {ORG_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">설명 (선택)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-800"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {saving ? "생성 중..." : "생성"}
          </button>
        </form>
      )}

      {/* 조직 목록 */}
      {orgs.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400 dark:text-neutral-500">등록된 조직이 없습니다.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orgs.map((org) => {
            const isExpanded = expandedId === org.id;
            const existingIds = new Set(org.leaders.map((l) => l.user_id));
            const available = profiles.filter((p) => !existingIds.has(p.id));

            return (
              <li
                key={org.id}
                className={`overflow-hidden rounded-xl border bg-white transition-all dark:bg-neutral-900 ${
                  isExpanded
                    ? "border-neutral-400 shadow-md dark:border-neutral-600"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {/* 헤더 (클릭으로 토글) */}
                <div className="flex items-center justify-between p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => toggleExpand(org.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{org.name}</h2>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {ORG_TYPE_LABEL[org.type]}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                    {/* 축소 상태에서 담당자 미리보기 */}
                    {!isExpanded && org.leaders.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {org.leaders.map((l) => (
                          <span
                            key={l.user_id}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            {l.name}
                            <span className="text-blue-400 dark:text-blue-500">
                              ({ORG_ROLE_LABEL[l.role]})
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                    {org.description && !isExpanded && (
                      <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
                        {org.description}
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(org.id)}
                    className="ml-4 shrink-0 text-sm text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>

                {/* 확장 패널 — 리더 관리 */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 px-4 pb-5 pt-4 sm:px-5 dark:border-neutral-800">
                    {org.description && (
                      <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
                        {org.description}
                      </p>
                    )}

                    <h3 className="text-sm font-semibold">담당 리더/교역자</h3>

                    {/* 에러 표시 */}
                    {leaderError && (
                      <p className="mt-2 text-sm text-red-500">{leaderError}</p>
                    )}

                    {/* 현재 리더 목록 */}
                    {org.leaders.length > 0 && (
                      <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                        {org.leaders.map((l) => (
                          <li key={l.user_id} className="flex items-center justify-between px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{l.name}</span>
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {ORG_ROLE_LABEL[l.role]}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLeader(org.id, l.user_id)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              해제
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* 리더 추가 */}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
                        >
                          <option value="">교인 선택</option>
                          {available.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name || "(이름 없음)"} {p.role === "admin" ? "(관리자)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-1.5">
                        {(["leader", "pastor"] as OrgLeader["role"][]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedRole(r)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                              selectedRole === r
                                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                : "border border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
                            }`}
                          >
                            {ORG_ROLE_LABEL[r]}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addLeader(org.id)}
                        disabled={!selectedUserId}
                        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
