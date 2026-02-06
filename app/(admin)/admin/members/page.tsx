"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Container from "@/src/components/Container";
import { createClient } from "@/src/lib/supabase/client";
import type { Profile } from "@/src/types/database";

export default function MembersPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setProfiles(data ?? []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRole = async (
    id: string,
    currentRole: Profile["role"],
  ) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", id);
    await load();
    setSaving(false);
    router.refresh();
  };

  return (
    <Container as="main" size="lg" className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">교인 관리</h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        교인 목록과 역할을 관리합니다.
      </p>

      {saving && (
        <p className="mt-4 text-sm text-neutral-500">저장 중...</p>
      )}

      {profiles.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400 dark:text-neutral-500">
            등록된 교인이 없습니다.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">
                  이름
                </th>
                <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">
                  연락처
                </th>
                <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">
                  가입일
                </th>
                <th className="pb-3 text-right font-medium text-neutral-500 dark:text-neutral-400">
                  역할
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 font-medium">{p.name || "이름 없음"}</td>
                  <td className="py-3 text-neutral-500 dark:text-neutral-400">
                    {p.phone || "—"}
                  </td>
                  <td className="py-3 text-neutral-500 dark:text-neutral-400">
                    {new Date(p.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleRole(p.id, p.role)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        p.role === "admin"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {p.role === "admin" ? "관리자" : "멤버"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
