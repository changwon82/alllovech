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

export async function createService(fd: FormData): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const name = fd.get("name") as string;
  const sub = (fd.get("sub") as string) || null;
  const timesRaw = fd.get("times") as string;
  const times = timesRaw
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  const location = fd.get("location") as string;
  const bg = fd.get("bg") === "on";

  // sort_order: 마지막
  const { data: last } = await admin
    .from("worship_services")
    .select("sort_order")
    .is("parent_id", null)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const { error } = await admin.from("worship_services").insert({
    name,
    sub,
    times,
    location,
    bg,
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) return { error: error.message };
  revalidatePath("/worship");
  return { error: "" };
}

export async function updateService(id: string, fd: FormData): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const name = fd.get("name") as string;
  const sub = (fd.get("sub") as string) || null;
  const timesRaw = fd.get("times") as string;
  const times = timesRaw
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  const location = fd.get("location") as string;
  const bg = fd.get("bg") === "on";

  const { error } = await admin
    .from("worship_services")
    .update({ name, sub, times, location, bg })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/worship");
  return { error: "" };
}

export async function deleteService(id: string): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const { error } = await admin
    .from("worship_services")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/worship");
  return { error: "" };
}

export async function reorderService(id: string, direction: "up" | "down"): Promise<Result> {
  const auth = await checkAdmin();
  if ("error" in auth) return auth as Result;

  const admin = createAdminClient();
  const { data: all } = await admin
    .from("worship_services")
    .select("id, sort_order")
    .is("parent_id", null)
    .order("sort_order");

  if (!all) return { error: "데이터 조회 실패" };

  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return { error: "항목을 찾을 수 없습니다." };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return { error: "" };

  const a = all[idx];
  const b = all[swapIdx];

  await Promise.all([
    admin
      .from("worship_services")
      .update({ sort_order: b.sort_order })
      .eq("id", a.id),
    admin
      .from("worship_services")
      .update({ sort_order: a.sort_order })
      .eq("id", b.id),
  ]);

  revalidatePath("/worship");
  return { error: "" };
}
