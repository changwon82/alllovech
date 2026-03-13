"use server";

import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { deleteFromR2 } from "@/lib/r2";
import { processAndUpload } from "@/lib/upload";

const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";
const R2_SITE_PREFIX = `${R2_PUBLIC}/site/`;

function extractR2SiteKeys(json: string): string[] {
  try {
    const slides = JSON.parse(json) as { src?: string }[];
    return slides
      .map((s) => s.src)
      .filter((src): src is string => !!src && src.startsWith(R2_SITE_PREFIX))
      .map((src) => src.replace(`${R2_PUBLIC}/`, ""));
  } catch {
    return [];
  }
}

export async function updateSetting(key: string, value: string) {
  const { admin } = await requireAdmin();

  const { error } = await admin
    .from("admin_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) return { error: error.message };
  return { success: true };
}

export async function uploadSiteImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file) return { error: "파일이 없습니다" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const keyBase = `site/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { r2Key } = await processAndUpload(file, keyBase, ext, "ATTACHMENT");
    return { url: `${R2_PUBLIC}/${r2Key}` };
  } catch (e) {
    console.error("R2 upload error:", e);
    return { error: e instanceof Error ? e.message : "업로드 실패" };
  }
}

export async function upsertSetting(key: string, value: string) {
  const { admin } = await requireAdmin();

  // hero_slides 저장 시 — 삭제된 R2 이미지 정리
  if (key === "hero_slides") {
    const { data: prev } = await admin
      .from("admin_settings")
      .select("value")
      .eq("key", "hero_slides")
      .maybeSingle();

    if (prev?.value) {
      const oldKeys = extractR2SiteKeys(prev.value);
      const newKeys = new Set(extractR2SiteKeys(value));
      const removed = oldKeys.filter((k) => !newKeys.has(k));
      await Promise.all(removed.map((k) => deleteFromR2(k).catch(() => {})));
    }
  }

  const { error } = await admin
    .from("admin_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}
