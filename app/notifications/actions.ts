"use server";

import { getSessionUser } from "@/lib/supabase/server";

export type EnrichedNotification = {
  id: string;
  type: string;
  actor_id: string | null;
  actor_name: string | null;
  reference_id: string | null;
  comment_id: string | null;
  message: string | null;
  group_id: string | null;
  group_name: string | null;
  is_read: boolean;
  created_at: string;
  reflection_day: number | null;
};

import { parseCommentMessage } from "@/lib/notifications";

export async function getNotifications(): Promise<{ notifications: EnrichedNotification[]; error?: string }> {
  const { supabase, user } = await getSessionUser();
  if (!user) return { notifications: [], error: "로그인 필요" };

  const { data: rawNotifications } = await supabase
    .from("notifications")
    .select("id, type, actor_id, reference_id, group_id, message, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = rawNotifications ?? [];
  const actorIds = [...new Set(notifications.map((n) => n.actor_id).filter(Boolean))] as string[];
  const reflectionIds = [...new Set(notifications.map((n) => n.reference_id).filter(Boolean))] as string[];
  const groupIds = [...new Set(notifications.map((n) => n.group_id).filter(Boolean))] as string[];

  const actorNames: Record<string, string> = {};
  const reflectionDays: Record<string, number> = {};
  const groupNames: Record<string, string> = {};

  const [actorResult, reflectionResult, groupResult] = await Promise.all([
    actorIds.length > 0
      ? supabase.from("profiles").select("id, name").in("id", actorIds)
      : null,
    reflectionIds.length > 0
      ? supabase.from("reflections").select("id, day").in("id", reflectionIds)
      : null,
    groupIds.length > 0
      ? supabase.from("groups").select("id, name").in("id", groupIds)
      : null,
  ]);
  if (actorResult?.data) {
    for (const p of actorResult.data) actorNames[p.id] = p.name;
  }
  if (reflectionResult?.data) {
    for (const r of reflectionResult.data) reflectionDays[r.id] = r.day;
  }
  if (groupResult?.data) {
    for (const g of groupResult.data) groupNames[g.id] = g.name;
  }

  return {
    notifications: notifications.map((n) => {
      const rawMsg = (n as { message?: string | null }).message ?? null;
      const parsed = n.type === "comment" ? parseCommentMessage(rawMsg) : { commentId: null, text: rawMsg };
      return {
        id: n.id,
        type: n.type,
        actor_id: n.actor_id ?? null,
        actor_name: n.actor_id ? (actorNames[n.actor_id] ?? null) : null,
        reference_id: n.reference_id,
        comment_id: parsed.commentId,
        message: parsed.text,
        group_id: n.group_id ?? null,
        group_name: n.group_id ? (groupNames[n.group_id] ?? null) : null,
        is_read: n.is_read,
        created_at: n.created_at,
        reflection_day: n.reference_id ? (reflectionDays[n.reference_id] ?? null) : null,
      };
    }),
  };
}

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

export async function deleteNotification(notificationId: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인 필요" };

  await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { success: true };
}

export async function deleteAllNotifications() {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인 필요" };

  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id);

  return { success: true };
}
