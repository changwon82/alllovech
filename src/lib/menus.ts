import { createClient } from "@/src/lib/supabase/server";
import type { PublicMenuTreeItem } from "@/src/types/database";

export async function getMenusTree(): Promise<PublicMenuTreeItem[]> {
  try {
    const supabase = await createClient();

    const [menusRes, groupsRes, itemsRes] = await Promise.all([
      supabase.from("public_menus").select("*").order("sort_order"),
      supabase.from("public_menu_groups").select("*").order("sort_order"),
      supabase.from("public_menu_items").select("*").order("sort_order"),
    ]);

    if (menusRes.error || groupsRes.error || itemsRes.error) return [];

    const menus = menusRes.data ?? [];
    const groups = groupsRes.data ?? [];
    const items = itemsRes.data ?? [];

    return menus.map((menu) => ({
      label: menu.label,
      href: menu.href,
      description: menu.description,
      groups: groups
        .filter((g) => g.menu_id === menu.id)
        .map((group) => ({
          title: group.title,
          items: items
            .filter((i) => i.group_id === group.id)
            .map((i) => ({ label: i.label, href: i.href })),
        })),
    }));
  } catch {
    return [];
  }
}
