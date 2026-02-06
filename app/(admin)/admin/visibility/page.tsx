"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Container from "@/src/components/Container";
import { createClient } from "@/src/lib/supabase/client";
import type { VisibilitySetting, Post, Group } from "@/src/types/database";

export default function VisibilityPage() {
  const supabase = createClient();
  const router = useRouter();

  const [settings, setSettings] = useState<VisibilitySetting[]>([]);
  const [posts, setPosts] = useState<Pick<Post, "id" | "title" | "is_public" | "category">[]>([]);
  const [groups, setGroups] = useState<Pick<Group, "id" | "name" | "is_public">[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [settingsRes, postsRes, groupsRes] = await Promise.all([
      supabase.from("visibility_settings").select("*"),
      supabase
        .from("posts")
        .select("id, title, is_public, category")
        .order("created_at", { ascending: false }),
      supabase
        .from("groups")
        .select("id, name, is_public")
        .order("created_at", { ascending: false }),
    ]);
    setSettings(settingsRes.data ?? []);
    setPosts(postsRes.data ?? []);
    setGroups(groupsRes.data ?? []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── 섹션 토글 ── */
  const toggleSection = async (section: string, current: boolean) => {
    setSaving(true);
    await supabase
      .from("visibility_settings")
      .update({
        is_visible_on_landing: !current,
        updated_at: new Date().toISOString(),
      })
      .eq("section", section);
    await load();
    setSaving(false);
    router.refresh();
  };

  /* ── 개별 항목 토글 ── */
  const togglePostPublic = async (id: string, current: boolean) => {
    setSaving(true);
    await supabase
      .from("posts")
      .update({ is_public: !current, updated_at: new Date().toISOString() })
      .eq("id", id);
    await load();
    setSaving(false);
    router.refresh();
  };

  const toggleGroupPublic = async (id: string, current: boolean) => {
    setSaving(true);
    await supabase
      .from("groups")
      .update({ is_public: !current })
      .eq("id", id);
    await load();
    setSaving(false);
    router.refresh();
  };

  const sectionLabel: Record<string, string> = {
    community: "커뮤니티",
    groups: "소그룹",
  };

  return (
    <Container as="main" size="lg" className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">콘텐츠 공개 관리</h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        랜딩페이지에 노출할 섹션과 개별 항목을 관리합니다.
      </p>

      {saving && (
        <p className="mt-4 text-sm text-neutral-500">저장 중...</p>
      )}

      {/* ── 섹션 토글 ── */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">섹션 노출 설정</h2>
        <div className="mt-4 space-y-3">
          {settings.map((s) => (
            <div
              key={s.section}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div>
                <p className="font-medium">
                  {sectionLabel[s.section] ?? s.section}
                </p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500">
                  최대 {s.max_items}개 항목 노출
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  toggleSection(s.section, s.is_visible_on_landing)
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  s.is_visible_on_landing
                    ? "bg-green-500"
                    : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    s.is_visible_on_landing ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── 게시글 공개 토글 ── */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">게시글 공개 설정</h2>
        {posts.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400 dark:text-neutral-500">
            게시글이 없습니다.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {posts.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePostPublic(p.id, p.is_public)}
                  className={`ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    p.is_public
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {p.is_public ? "공개" : "비공개"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── 소그룹 공개 토글 ── */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">소그룹 공개 설정</h2>
        {groups.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400 dark:text-neutral-500">
            소그룹이 없습니다.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {groups.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <p className="text-sm font-medium">{g.name}</p>
                <button
                  type="button"
                  onClick={() => toggleGroupPublic(g.id, g.is_public)}
                  className={`ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    g.is_public
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {g.is_public ? "공개" : "비공개"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
