"use client";

import { useEffect, useState, useRef } from "react";
import Container from "@/src/components/Container";
import { createClient } from "@/src/lib/supabase/client";
import type { PublicMenu, PublicMenuGroup, PublicMenuItem } from "@/src/types/database";

export default function AdminMenusPage() {
  const supabase = useRef(createClient()).current;

  const [menus, setMenus] = useState<PublicMenu[]>([]);
  const [groups, setGroups] = useState<PublicMenuGroup[]>([]);
  const [items, setItems] = useState<PublicMenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedMenuIds, setExpandedMenuIds] = useState<Set<string>>(new Set());
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());

  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [addMenu, setAddMenu] = useState(false);
  const [addGroupMenuId, setAddGroupMenuId] = useState<string | null>(null);
  const [addItemGroupId, setAddItemGroupId] = useState<string | null>(null);

  const load = async () => {
    const [m, g, i] = await Promise.all([
      supabase.from("public_menus").select("*").order("sort_order"),
      supabase.from("public_menu_groups").select("*").order("sort_order"),
      supabase.from("public_menu_items").select("*").order("sort_order"),
    ]);
    if (m.error) setError(m.error.message);
    else setMenus(m.data ?? []);
    if (g.error) setError(g.error.message);
    else setGroups(g.data ?? []);
    if (i.error) setError(i.error.message);
    else setItems(i.data ?? []);
    setLoaded(true);
    if (m.data?.length) setExpandedMenuIds(new Set(m.data.map((x) => x.id)));
    if (g.data?.length) setExpandedGroupIds(new Set(g.data.map((x) => x.id)));
  };

  useEffect(() => { load(); }, []);

  const getGroups = (menuId: string) => groups.filter((g) => g.menu_id === menuId);
  const getItems = (groupId: string) => items.filter((i) => i.group_id === groupId);

  const maxSort = (arr: { sort_order: number }[]) =>
    arr.length ? Math.max(...arr.map((x) => x.sort_order)) : 0;

  const handleCreateMenu = async (label: string, href: string, description: string) => {
    const sort = maxSort(menus) + 1;
    const { error: e } = await supabase.from("public_menus").insert({ label, href, description, sort_order: sort });
    if (!e) { await load(); setAddMenu(false); }
    else setError(e.message);
  };

  const handleUpdateMenu = async (id: string, label: string, href: string, description: string) => {
    const { error: e } = await supabase.from("public_menus").update({ label, href, description }).eq("id", id);
    if (!e) { await load(); setEditingMenuId(null); }
    else setError(e.message);
  };

  const toggleMenu = (id: string) => {
    setExpandedMenuIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (id: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm("이 대메뉴와 하위 그룹·소메뉴를 모두 삭제합니다. 계속할까요?")) return;
    const { error: e } = await supabase.from("public_menus").delete().eq("id", id);
    if (!e) await load();
    else setError(e.message);
  };

  const handleCreateGroup = async (menuId: string, title: string) => {
    const menuGroups = getGroups(menuId);
    const sort = maxSort(menuGroups) + 1;
    const { error: e } = await supabase.from("public_menu_groups").insert({ menu_id: menuId, title, sort_order: sort });
    if (!e) { await load(); setAddGroupMenuId(null); }
    else setError(e.message);
  };

  const handleUpdateGroup = async (id: string, title: string) => {
    const { error: e } = await supabase.from("public_menu_groups").update({ title }).eq("id", id);
    if (!e) { await load(); setEditingGroupId(null); }
    else setError(e.message);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("이 그룹과 하위 소메뉴를 모두 삭제합니다. 계속할까요?")) return;
    const { error: e } = await supabase.from("public_menu_groups").delete().eq("id", id);
    if (!e) await load();
    else setError(e.message);
  };

  const handleCreateItem = async (groupId: string, label: string, href: string) => {
    const groupItems = getItems(groupId);
    const sort = maxSort(groupItems) + 1;
    const { error: e } = await supabase.from("public_menu_items").insert({ group_id: groupId, label, href, sort_order: sort });
    if (!e) { await load(); setAddItemGroupId(null); }
    else setError(e.message);
  };

  const handleUpdateItem = async (id: string, label: string, href: string) => {
    const { error: e } = await supabase.from("public_menu_items").update({ label, href }).eq("id", id);
    if (!e) { await load(); setEditingItemId(null); }
    else setError(e.message);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("이 소메뉴를 삭제합니다. 계속할까요?")) return;
    const { error: e } = await supabase.from("public_menu_items").delete().eq("id", id);
    if (!e) await load();
    else setError(e.message);
  };

  if (!loaded) {
    return (
      <Container as="main" className="py-12">
        <p className="text-neutral-400">로딩 중...</p>
      </Container>
    );
  }

  return (
    <Container as="main" size="lg" className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">메뉴 관리</h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        공개 사이트 상단 메뉴(대메뉴 · 그룹 · 소메뉴)를 편집합니다.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-2">
        {menus.map((menu) => (
          <div key={menu.id} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {/* 대메뉴 행 */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <button
                  type="button"
                  onClick={() => toggleMenu(menu.id)}
                  className="shrink-0 text-neutral-400"
                  aria-label={expandedMenuIds.has(menu.id) ? "접기" : "펼치기"}
                >
                  {expandedMenuIds.has(menu.id) ? "▼" : "▶"}
                </button>
                {editingMenuId === menu.id ? (
                  <MenuEditForm
                    menu={menu}
                    onSave={(label, href, description) => handleUpdateMenu(menu.id, label, href, description)}
                    onCancel={() => setEditingMenuId(null)}
                  />
                ) : (
                  <>
                    <span className="font-semibold">{menu.label}</span>
                    <span className="text-sm text-neutral-400">{menu.href}</span>
                  </>
                )}
              </div>
              {editingMenuId !== menu.id && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMenuId(menu.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMenu(menu.id)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* 그룹 목록 */}
            {expandedMenuIds.has(menu.id) && (
              <div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
                {getGroups(menu.id).map((group) => (
                  <div key={group.id} className="mb-4 last:mb-0">
                    <div className="mb-2 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50">
                      {editingGroupId === group.id ? (
                        <GroupEditForm
                          group={group}
                          onSave={(title) => handleUpdateGroup(group.id, title)}
                          onCancel={() => setEditingGroupId(null)}
                        />
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            className="flex items-center gap-2"
                          >
                            <span className="text-neutral-400 text-xs">
                              {expandedGroupIds.has(group.id) ? "▼" : "▶"}
                            </span>
                            <span className="font-medium">{group.title}</span>
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingGroupId(group.id)}
                              className="text-xs text-blue-600"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-xs text-red-500"
                            >
                              삭제
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {expandedGroupIds.has(group.id) && (
                      <div className="ml-4 space-y-1 border-l-2 border-neutral-200 pl-4 dark:border-neutral-700">
                        {getItems(group.id).map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-1">
                            {editingItemId === item.id ? (
                              <ItemEditForm
                                item={item}
                                onSave={(label, href) => handleUpdateItem(item.id, label, href)}
                                onCancel={() => setEditingItemId(null)}
                              />
                            ) : (
                              <>
                                <span className="text-sm">{item.label}</span>
                                <span className="text-xs text-neutral-400">{item.href}</span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemId(item.id)}
                                    className="text-xs text-blue-600"
                                  >
                                    수정
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-xs text-red-500"
                                  >
                                    삭제
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        {addItemGroupId === group.id ? (
                          <ItemAddForm
                            onSave={(label, href) => handleCreateItem(group.id, label, href)}
                            onCancel={() => setAddItemGroupId(null)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddItemGroupId(group.id)}
                            className="text-xs text-neutral-500 hover:underline"
                          >
                            + 소메뉴 추가
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {addGroupMenuId === menu.id ? (
                  <GroupAddForm
                    onSave={(title) => handleCreateGroup(menu.id, title)}
                    onCancel={() => setAddGroupMenuId(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddGroupMenuId(menu.id)}
                    className="text-sm text-neutral-500 hover:underline"
                  >
                    + 그룹 추가
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {addMenu ? (
          <MenuAddForm
            onSave={(label, href, description) => handleCreateMenu(label, href, description)}
            onCancel={() => setAddMenu(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddMenu(true)}
            className="rounded-xl border-2 border-dashed border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-700 dark:hover:border-neutral-600"
          >
            + 대메뉴 추가
          </button>
        )}
      </div>
    </Container>
  );
}

function MenuEditForm({
  menu,
  onSave,
  onCancel,
}: {
  menu: PublicMenu;
  onSave: (label: string, href: string, description: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(menu.label);
  const [href, setHref] = useState(menu.href);
  const [description, setDescription] = useState(menu.description);

  return (
    <div className="flex w-full min-w-0 flex-1 items-center gap-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-28 shrink-0 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 sm:w-36"
        placeholder="대메뉴 이름"
      />
      <input
        value={href}
        onChange={(e) => setHref(e.target.value)}
        className="w-24 shrink-0 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 sm:w-32"
        placeholder="링크"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800"
        placeholder="설명"
      />
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => onSave(label, href, description)} className="text-sm text-blue-600">저장</button>
        <button type="button" onClick={onCancel} className="text-sm text-neutral-500">취소</button>
      </div>
    </div>
  );
}

function MenuAddForm({
  onSave,
  onCancel,
}: {
  onSave: (label: string, href: string, description: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("/");
  const [description, setDescription] = useState("");

  return (
    <div className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-28 shrink-0 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 sm:w-36"
        placeholder="대메뉴 이름"
      />
      <input
        value={href}
        onChange={(e) => setHref(e.target.value)}
        className="w-24 shrink-0 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 sm:w-32"
        placeholder="링크"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800"
        placeholder="설명"
      />
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => onSave(label, href, description)} className="rounded bg-neutral-900 px-3 py-1 text-sm text-white dark:bg-white dark:text-neutral-900">추가</button>
        <button type="button" onClick={onCancel} className="text-sm text-neutral-500">취소</button>
      </div>
    </div>
  );
}

function GroupEditForm({
  group,
  onSave,
  onCancel,
}: {
  group: PublicMenuGroup;
  onSave: (title: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(group.title);

  return (
    <div className="flex items-center gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 w-48"
        placeholder="그룹 제목"
      />
      <button type="button" onClick={() => onSave(title)} className="text-xs text-blue-600">저장</button>
      <button type="button" onClick={onCancel} className="text-xs text-neutral-500">취소</button>
    </div>
  );
}

function GroupAddForm({
  onSave,
  onCancel,
}: {
  onSave: (title: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 w-48"
        placeholder="그룹 제목"
      />
      <button type="button" onClick={() => onSave(title)} className="text-sm text-blue-600">추가</button>
      <button type="button" onClick={onCancel} className="text-sm text-neutral-500">취소</button>
    </div>
  );
}

function ItemEditForm({
  item,
  onSave,
  onCancel,
}: {
  item: PublicMenuItem;
  onSave: (label: string, href: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(item.label);
  const [href, setHref] = useState(item.href);

  return (
    <div className="flex items-center gap-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="rounded border border-neutral-300 px-2 py-1 text-sm w-32 dark:border-neutral-600 dark:bg-neutral-800"
        placeholder="이름"
      />
      <input
        value={href}
        onChange={(e) => setHref(e.target.value)}
        className="rounded border border-neutral-300 px-2 py-1 text-sm w-40 dark:border-neutral-600 dark:bg-neutral-800"
        placeholder="링크"
      />
      <button type="button" onClick={() => onSave(label, href)} className="text-xs text-blue-600">저장</button>
      <button type="button" onClick={onCancel} className="text-xs text-neutral-500">취소</button>
    </div>
  );
}

function ItemAddForm({
  onSave,
  onCancel,
}: {
  onSave: (label: string, href: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("/");

  return (
    <div className="flex items-center gap-2 py-1">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="rounded border border-neutral-300 px-2 py-1 text-sm w-32 dark:border-neutral-600 dark:bg-neutral-800"
        placeholder="이름"
      />
      <input
        value={href}
        onChange={(e) => setHref(e.target.value)}
        className="rounded border border-neutral-300 px-2 py-1 text-sm w-40 dark:border-neutral-600 dark:bg-neutral-800"
        placeholder="링크"
      />
      <button type="button" onClick={() => onSave(label, href)} className="text-xs text-blue-600">추가</button>
      <button type="button" onClick={onCancel} className="text-xs text-neutral-500">취소</button>
    </div>
  );
}
