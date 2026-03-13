"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";

type Result = { error: string };

async function checkAdmin(): Promise<Result | { user: { id: string } }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const roles = await getUserRoles(supabase, user.id);
  if (!isAdminRole(roles)) return { error: "관리자 권한이 필요합니다." };
  return { user };
}

// ── 설교 CRUD ──

type SermonInput = {
  title: string;
  preacher: string;
  sermon_date: string;
  scripture: string;
  category: string;
  youtube_url: string;
};

export async function createSermon(input: SermonInput): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const { error } = await admin.from("sermons").insert({
    title: input.title,
    preacher: input.preacher,
    sermon_date: input.sermon_date,
    scripture: input.scripture || null,
    category: input.category,
    youtube_url: input.youtube_url || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/sermon");
  return { error: "" };
}

export async function updateSermon(
  id: number,
  input: SermonInput,
): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const { error } = await admin
    .from("sermons")
    .update({
      title: input.title,
      preacher: input.preacher,
      sermon_date: input.sermon_date,
      scripture: input.scripture || null,
      category: input.category,
      youtube_url: input.youtube_url || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/sermon");
  return { error: "" };
}

export async function deleteSermon(id: number): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const { error } = await admin.from("sermons").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/sermon");
  return { error: "" };
}

// ── 카테고리 CRUD ──

export async function createCategory(name: string): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const { data: last } = await admin
    .from("sermon_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (last?.[0]?.sort_order ?? 0) + 1;

  const { error } = await admin
    .from("sermon_categories")
    .insert({ name, sort_order: nextOrder });

  if (error) return { error: error.message };
  revalidatePath("/sermon");
  return { error: "" };
}

export async function updateCategory(id: number, name: string): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const { error } = await admin
    .from("sermon_categories")
    .update({ name })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/sermon");
  return { error: "" };
}

export async function deleteCategory(id: number): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const { error } = await admin
    .from("sermon_categories")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/sermon");
  return { error: "" };
}

export async function reorderCategory(
  id: number,
  direction: "up" | "down",
): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const { data: all } = await admin
    .from("sermon_categories")
    .select("id, sort_order")
    .order("sort_order");

  if (!all) return { error: "카테고리를 불러올 수 없습니다." };

  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return { error: "카테고리를 찾을 수 없습니다." };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return { error: "" };

  const [a, b] = [all[idx], all[swapIdx]];
  await Promise.all([
    admin
      .from("sermon_categories")
      .update({ sort_order: b.sort_order })
      .eq("id", a.id),
    admin
      .from("sermon_categories")
      .update({ sort_order: a.sort_order })
      .eq("id", b.id),
  ]);

  revalidatePath("/sermon");
  return { error: "" };
}
