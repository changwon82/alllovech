"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { commentPushPayload, amenPushPayload } from "@/lib/push-messages";

export async function addComment(reflectionId: string, content: string, parentId?: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const row: Record<string, unknown> = { reflection_id: reflectionId, user_id: user.id, content };
  if (parentId) row.parent_id = parentId;

  const { data, error } = await supabase
    .from("reflection_comments")
    .insert(row)
    .select("id, content, created_at, user_id, parent_id, profiles:user_id (name)")
    .single();

  if (error) return { error: error.message };

  // 묵상 작성자에게 알림 (본인 제외)
  const { data: reflection } = await supabase
    .from("reflections")
    .select("user_id, day")
    .eq("id", reflectionId)
    .single();

  if (reflection && reflection.user_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: reflection.user_id,
      type: "comment",
      actor_id: user.id,
      reference_id: reflectionId,
    });

    // 푸시 알림 (fire-and-forget)
    const actorName = (data as unknown as { profiles?: { name?: string } }).profiles?.name ?? "누군가";
    sendPushToUser(reflection.user_id, commentPushPayload(actorName, reflection.day)).catch(() => {});
  }

  return { comment: data };
}

export async function deleteComment(commentId: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("reflection_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { deleted: true };
}

export async function toggleReaction(reflectionId: string, type: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: existing } = await supabase
    .from("reflection_reactions")
    .select("reflection_id, type")
    .eq("reflection_id", reflectionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && existing.type === type) {
    // 같은 리액션 → 제거
    const { error } = await supabase
      .from("reflection_reactions")
      .delete()
      .eq("reflection_id", reflectionId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    return { toggled: false, type };
  } else if (existing) {
    // 다른 리액션 → 변경
    const { error } = await supabase
      .from("reflection_reactions")
      .update({ type })
      .eq("reflection_id", reflectionId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    return { toggled: true, type, changed: true };
  } else {
    // 새 리액션
    const { error } = await supabase
      .from("reflection_reactions")
      .insert({ reflection_id: reflectionId, user_id: user.id, type });
    if (error) return { error: error.message };

    // 묵상 작성자에게 알림 (본인 제외)
    const { data: reflection } = await supabase
      .from("reflections")
      .select("user_id, day")
      .eq("id", reflectionId)
      .single();

    if (reflection && reflection.user_id !== user.id) {
      const [, { data: actorProfile }] = await Promise.all([
        supabase.from("notifications").insert({
          user_id: reflection.user_id,
          type: "amen",
          actor_id: user.id,
          reference_id: reflectionId,
        }),
        supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
      ]);

      sendPushToUser(
        reflection.user_id,
        amenPushPayload(actorProfile?.name ?? "누군가", reflection.day)
      ).catch(() => {});
    }

    return { toggled: true, type };
  }
}
