"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Container from "@/src/components/Container";
import { createClient } from "@/src/lib/supabase/client";
import { ORG_TYPE_LABEL, ORG_ROLE_LABEL } from "@/src/types/database";
import type { Organization, OrgLeader } from "@/src/types/database";

interface LeaderRow {
  organization_id: string;
  user_id: string;
  role: OrgLeader["role"];
  profileName: string;
}

interface ProfileOption {
  id: string;
  name: string;
  role: string;
}

export default function AdminOrgDetailPage() {
  const params = useParams<{ id: string }>();
  const orgId = params.id;
  const supabase = useRef(createClient()).current;

  const [org, setOrg] = useState<Organization | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<OrgLeader["role"]>("leader");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ── 데이터 로드 ──
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      // org_leaders → profiles 직접 FK가 없으므로 조인하지 않고 별도 조회
      const [orgRes, leadersRes, profilesRes] = await Promise.all([
        supabase.from("organizations").select("*").eq("id", orgId).single(),
        supabase
          .from("org_leaders")
          .select("organization_id, user_id, role")
          .eq("organization_id", orgId),
        supabase.from("profiles").select("id, name, role").order("name"),
      ]);

      if (cancelled) return;

      if (orgRes.error) {
        setError("조직 로드 실패: " + orgRes.error.message);
        setLoaded(true);
        return;
      }

      const profiles: ProfileOption[] = (profilesRes.data ?? []).map((p) => ({
        id: p.id,
        name: p.name ?? "",
        role: p.role ?? "member",
      }));

      // 프로필 이름을 맵으로 변환
      const profileMap = new Map(profiles.map((p) => [p.id, p.name]));

      // 리더 목록에 프로필 이름 매핑
      const leaderRows: LeaderRow[] = (leadersRes.data ?? []).map((l) => ({
        organization_id: l.organization_id,
        user_id: l.user_id,
        role: l.role as OrgLeader["role"],
        profileName: profileMap.get(l.user_id) || "이름 없음",
      }));

      setOrg(orgRes.data);
      setLeaders(leaderRows);
      setAllProfiles(profiles);
      setLoaded(true);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [supabase, orgId]);

  // ── 리더 추가 ──
  const addLeader = async () => {
    if (!selectedUserId) return;
    setError(null);
    setSaving(true);

    const { error: insertError } = await supabase.from("org_leaders").insert({
      organization_id: orgId,
      user_id: selectedUserId,
      role: selectedRole,
    });

    if (insertError) {
      setSaving(false);
      if (insertError.code === "23505") {
        setError("이미 등록된 리더입니다.");
      } else {
        setError("리더 추가 실패: " + insertError.message);
      }
      return;
    }

    // 성공 → 즉시 UI에 반영
    const addedProfile = allProfiles.find((p) => p.id === selectedUserId);
    setLeaders((prev) => [
      ...prev,
      {
        organization_id: orgId,
        user_id: selectedUserId,
        role: selectedRole,
        profileName: addedProfile?.name || "이름 없음",
      },
    ]);
    setSelectedUserId("");
    setSaving(false);
  };

  // ── 리더 해제 ──
  const removeLeader = async (userId: string) => {
    setError(null);

    const { error: deleteError } = await supabase
      .from("org_leaders")
      .delete()
      .eq("organization_id", orgId)
      .eq("user_id", userId);

    if (deleteError) {
      setError("리더 해제 실패: " + deleteError.message);
      return;
    }

    // 성공 → 즉시 UI에서 제거
    setLeaders((prev) => prev.filter((l) => l.user_id !== userId));
  };

  // 이미 등록된 리더 제외
  const existingUserIds = new Set(leaders.map((l) => l.user_id));
  const availableProfiles = allProfiles.filter((p) => !existingUserIds.has(p.id));

  if (!loaded) {
    return (
      <Container as="main" className="py-12">
        <p className="text-neutral-400">로딩 중...</p>
      </Container>
    );
  }

  if (!org) {
    return (
      <Container as="main" className="py-12">
        <p className="text-neutral-400">조직을 찾을 수 없습니다.</p>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </Container>
    );
  }

  return (
    <Container as="main" size="lg" className="py-8 sm:py-12">
      <Link href="/admin/organizations" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← 조직 목록
      </Link>

      <div className="mt-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{org.name}</h1>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {ORG_TYPE_LABEL[org.type]}
          </span>
        </div>
        {org.description && (
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">{org.description}</p>
        )}
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 리더 목록 */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">담당 리더/교역자</h2>

        {leaders.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400 dark:text-neutral-500">지정된 리더가 없습니다.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {leaders.map((l) => (
              <li key={l.user_id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{l.profileName}</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {ORG_ROLE_LABEL[l.role]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeLeader(l.user_id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  해제
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 리더 추가 */}
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-end dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium">교인 선택</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">선택하세요</option>
              {availableProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || "(이름 없음)"} {p.role === "admin" ? "(관리자)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">역할</label>
            <div className="flex gap-2">
              {(["leader", "pastor"] as OrgLeader["role"][]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedRole === r
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
                  }`}
                >
                  {ORG_ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={addLeader}
            disabled={!selectedUserId || saving}
            className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {saving ? "추가 중..." : "추가"}
          </button>
        </div>
      </section>
    </Container>
  );
}
