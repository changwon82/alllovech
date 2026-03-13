"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { deleteFromR2 } from "@/lib/r2";
import { processAndUpload } from "@/lib/upload";
import { revalidatePath } from "next/cache";

const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { error: "로그인 필요" };

  const roles = await getUserRoles(supabase, session.user.id);
  if (!isAdminRole(roles)) return { error: "권한 없음" };

  return { error: null };
}

export async function createStaff(formData: FormData) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const name = (formData.get("name") as string)?.trim();
  const role = (formData.get("role") as string)?.trim();
  const dept = (formData.get("dept") as string)?.trim() || null;
  const file = formData.get("photo") as File | null;

  if (!name || !role) return { error: "이름과 직분은 필수입니다" };

  let photo_url: string | null = null;
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const keyBase = `site/staff/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { r2Key } = await processAndUpload(file, keyBase, ext, "ATTACHMENT");
    photo_url = `${R2_PUBLIC}/${r2Key}`;
  }

  const admin = createAdminClient();

  // 현재 최대 sort_order
  const { data: maxRow } = await admin
    .from("staff")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { error: insertError } = await admin
    .from("staff")
    .insert({ name, role, dept, photo_url, sort_order });

  if (insertError) return { error: insertError.message };

  revalidatePath("/about/staff");
  return { success: true };
}

export async function updateStaff(id: string, formData: FormData) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const name = (formData.get("name") as string)?.trim();
  const role = (formData.get("role") as string)?.trim();
  const dept = (formData.get("dept") as string)?.trim() || null;
  const file = formData.get("photo") as File | null;

  if (!name || !role) return { error: "이름과 직분은 필수입니다" };

  const admin = createAdminClient();

  const updates: Record<string, unknown> = { name, role, dept };

  if (file && file.size > 0) {
    // 기존 사진 삭제
    const { data: prev } = await admin
      .from("staff")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();
    if (prev?.photo_url?.includes(R2_PUBLIC)) {
      const oldKey = prev.photo_url.replace(`${R2_PUBLIC}/`, "");
      await deleteFromR2(oldKey).catch(() => {});
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const keyBase = `site/staff/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { r2Key } = await processAndUpload(file, keyBase, ext, "ATTACHMENT");
    updates.photo_url = `${R2_PUBLIC}/${r2Key}`;
  }

  const { error: updateError } = await admin
    .from("staff")
    .update(updates)
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/about/staff");
  return { success: true };
}

export async function deleteStaff(id: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();

  // 사진 삭제
  const { data: prev } = await admin
    .from("staff")
    .select("photo_url")
    .eq("id", id)
    .maybeSingle();
  if (prev?.photo_url?.includes(R2_PUBLIC)) {
    const oldKey = prev.photo_url.replace(`${R2_PUBLIC}/`, "");
    await deleteFromR2(oldKey).catch(() => {});
  }

  const { error: deleteError } = await admin
    .from("staff")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/about/staff");
  return { success: true };
}

export async function reorderStaff(id: string, direction: "up" | "down") {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();

  const { data: all } = await admin
    .from("staff")
    .select("id, sort_order")
    .order("sort_order");

  if (!all || all.length < 2) return { error: "이동할 수 없습니다" };

  const idx = all.findIndex((s) => s.id === id);
  if (idx < 0) return { error: "찾을 수 없습니다" };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return { success: true };

  const [a, b] = [all[idx], all[swapIdx]];
  await Promise.all([
    admin.from("staff").update({ sort_order: b.sort_order }).eq("id", a.id),
    admin.from("staff").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);

  revalidatePath("/about/staff");
  return { success: true };
}
