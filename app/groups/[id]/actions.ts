"use server";

import { getSessionUser } from "@/lib/supabase/server";

export async function addComment(reflectionId: string, content: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data, error } = await supabase
    .from("reflection_comments")
    .insert({ reflection_id: reflectionId, user_id: user.id, content })
    .select("id, content, created_at, user_id, profiles:user_id (name)")
    .single();

  if (error) return { error: error.message };

  // 묵상 작성자에게 알림 (본인 제외)
  const { data: reflection } = await supabase
    .from("reflections")
    .select("user_id")
    .eq("id", reflectionId)
    .single();

  if (reflection && reflection.user_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: reflection.user_id,
      type: "comment",
      actor_id: user.id,
      reference_id: reflectionId,
    });
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

export async function toggleAmen(reflectionId: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: existing } = await supabase
    .from("reflection_reactions")
    .select("reflection_id")
    .eq("reflection_id", reflectionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("reflection_reactions")
      .delete()
      .eq("reflection_id", reflectionId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    return { toggled: false };
  } else {
    const { error } = await supabase
      .from("reflection_reactions")
      .insert({ reflection_id: reflectionId, user_id: user.id, type: "amen" });
    if (error) return { error: error.message };

    // 묵상 작성자에게 알림 (본인 제외)
    const { data: reflection } = await supabase
      .from("reflections")
      .select("user_id")
      .eq("id", reflectionId)
      .single();

    if (reflection && reflection.user_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: reflection.user_id,
        type: "amen",
        actor_id: user.id,
        reference_id: reflectionId,
      });
    }

    return { toggled: true };
  }
}
