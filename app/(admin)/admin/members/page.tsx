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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", role: "" as Profile["role"] });

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

  const startEdit = (p: Profile) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, phone: p.phone || "", role: p.role });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", phone: "", role: "member" });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        name: editForm.name,
        phone: editForm.phone || null,
        role: editForm.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setEditingId(null);
    await load();
    setSaving(false);
    router.refresh();
  };

  const toggleRole = async (id: string, currentRole: Profile["role"]) => {
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
        교인 목록과 역할을 관리합니다. 교인을 클릭하여 정보를 수정할 수 있습니다.
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
        <ul className="mt-6 space-y-3">
          {profiles.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              {editingId === p.id ? (
                /* ── 편집 모드 ── */
                <div className="space-y-4 p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        이름
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-800"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        연락처
                      </label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="010-0000-0000"
                        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      역할
                    </label>
                    <div className="flex gap-2">
                      {(["member", "admin"] as Profile["role"][]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, role: r })}
                          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                            editForm.role === r
                              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                              : "border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
                          }`}
                        >
                          {r === "admin" ? "관리자" : "멤버"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                    <p className="text-xs text-neutral-400">
                      가입일: {new Date(p.created_at).toLocaleDateString("ko-KR")}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(p.id)}
                        disabled={saving}
                        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── 표시 모드 ── */
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-neutral-50 sm:p-5 dark:hover:bg-neutral-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.name || "이름 없음"}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.role === "admin"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                      >
                        {p.role === "admin" ? "관리자" : "멤버"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                      <span>{p.phone || "연락처 없음"}</span>
                      <span className="text-neutral-300 dark:text-neutral-700">|</span>
                      <span>{new Date(p.created_at).toLocaleDateString("ko-KR")} 가입</span>
                    </div>
                  </div>
                  <span className="ml-4 shrink-0 text-sm text-neutral-400 dark:text-neutral-500">
                    수정 →
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
