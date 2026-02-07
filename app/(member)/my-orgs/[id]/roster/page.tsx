"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Container from "@/src/components/Container";
import { createClient } from "@/src/lib/supabase/client";
import { ROSTER_STATUS_LABEL } from "@/src/types/database";
import type { RosterMember } from "@/src/types/database";

export default function RosterPage() {
  const supabase = createClient();
  const params = useParams<{ id: string }>();
  const orgId = params.id;

  const [members, setMembers] = useState<RosterMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("roster_members")
      .select("*")
      .eq("organization_id", orgId)
      .order("name");
    setMembers(data ?? []);
  }, [supabase, orgId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("roster_members").insert({
      organization_id: orgId,
      name,
      phone: phone || null,
      status: "new",
    });
    setName("");
    setPhone("");
    setShowForm(false);
    setSaving(false);
    await load();
  };

  const toggleStatus = async (member: RosterMember) => {
    const next: Record<string, RosterMember["status"]> = {
      active: "inactive",
      inactive: "active",
      new: "active",
    };
    await supabase
      .from("roster_members")
      .update({ status: next[member.status] })
      .eq("id", member.id);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 멤버를 명단에서 삭제하시겠습니까?")) return;
    await supabase.from("roster_members").delete().eq("id", id);
    await load();
  };

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    inactive: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <Container as="main" className="py-8 sm:py-12">
      <Link href={`/my-orgs/${orgId}`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← 조직 상세
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">명단 관리</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {showForm ? "취소" : "멤버 추가"}
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-end dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-800"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">연락처 (선택)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-800"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            추가
          </button>
        </form>
      )}

      {/* 명단 */}
      <p className="mt-4 text-sm text-neutral-400 dark:text-neutral-500">
        총 {members.length}명 (활성 {members.filter((m) => m.status === "active").length}명)
      </p>

      {members.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400">명단이 비어 있습니다.</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">{m.name}</span>
                {m.phone && (
                  <span className="ml-2 text-xs text-neutral-400">{m.phone}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleStatus(m)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusColor[m.status]}`}
                >
                  {ROSTER_STATUS_LABEL[m.status]}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
