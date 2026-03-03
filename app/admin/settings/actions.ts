"use server";

import { requireAdmin } from "@/lib/admin";

export async function updateSetting(key: string, value: string) {
  const { admin } = await requireAdmin();

  const { error } = await admin
    .from("admin_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) return { error: error.message };
  return { success: true };
}
