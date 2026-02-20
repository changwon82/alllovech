"use server";

import { getSessionUser } from "@/lib/supabase/server";

export async function updateProfile(name: string, phone: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("profiles")
    .update({
      name: name.trim(),
      phone: phone.trim() || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
