"use server";

import { getSessionUser } from "@/lib/supabase/server";

export async function markAllRead() {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인 필요" };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return { success: true };
}

export async function markRead(notificationId: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인 필요" };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { success: true };
}
