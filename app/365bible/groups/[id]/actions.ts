"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { commentPushPayload, amenPushPayload } from "@/lib/push-messages";

export async function addComment(reflectionId: string, content: string, parentId?: string, groupId?: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const row: Record<string, unknown> = { reflection_id: reflectionId, user_id: user.id, content };
  if (parentId) row.parent_id = parentId;
  if (groupId) row.group_id = groupId;

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
    const [, groupResult] = await Promise.all([
      supabase.from("notifications").insert({
        user_id: reflection.user_id,
        type: "comment",
        actor_id: user.id,
        reference_id: reflectionId,
        group_id: groupId ?? null,
        message: `${data.id}|${content.length > 30 ? content.slice(0, 30) + "…" : content}`,
      }),
      groupId ? supabase.from("groups").select("name").eq("id", groupId).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    // 푸시 알림 (fire-and-forget)
    const actorName = (data as unknown as { profiles?: { name?: string } }).profiles?.name ?? "누군가";
    const snippet = content.length > 30 ? content.slice(0, 30) + "…" : content;
    sendPushToUser(reflection.user_id, commentPushPayload(actorName, reflection.day, snippet, groupResult.data?.name)).catch(() => {});
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

// 그룹에서 공유 해제 (해당 그룹의 댓글/리액션도 삭제)
export async function unshareFromGroup(reflectionId: string, groupId: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // 본인 묵상인지 확인
  const { data: reflection } = await supabase
    .from("reflections")
    .select("id")
    .eq("id", reflectionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!reflection) return { error: "권한이 없습니다." };

  // 댓글/리액션 삭제 + 공유 해제
  await Promise.all([
    supabase.from("reflection_comments").delete().eq("reflection_id", reflectionId).eq("group_id", groupId),
    supabase.from("reflection_reactions").delete().eq("reflection_id", reflectionId).eq("group_id", groupId),
    supabase.from("reflection_group_shares").delete().eq("reflection_id", reflectionId).eq("group_id", groupId),
  ]);

  // 남은 공유가 없으면 visibility를 private로
  const { data: remaining } = await supabase
    .from("reflection_group_shares")
    .select("group_id")
    .eq("reflection_id", reflectionId)
    .limit(1);

  if (!remaining || remaining.length === 0) {
    await supabase.from("reflections").update({ visibility: "private" }).eq("id", reflectionId);
  }

  return { unshared: true };
}

// 묵상 내용 수정 (본인만)
export async function editReflection(reflectionId: string, content: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data, error } = await supabase
    .from("reflections")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", reflectionId)
    .eq("user_id", user.id)
    .select("id, content")
    .single();

  if (error) return { error: error.message };
  return { reflection: data };
}

export async function toggleReaction(reflectionId: string, type: string, groupId?: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  let query = supabase
    .from("reflection_reactions")
    .select("reflection_id, type")
    .eq("reflection_id", reflectionId)
    .eq("user_id", user.id);
  if (groupId) query = query.eq("group_id", groupId);

  const { data: existing } = await query.maybeSingle();

  if (existing && existing.type === type) {
    // 같은 리액션 → 제거
    let del = supabase
      .from("reflection_reactions")
      .delete()
      .eq("reflection_id", reflectionId)
      .eq("user_id", user.id);
    if (groupId) del = del.eq("group_id", groupId);
    const { error } = await del;
    if (error) return { error: error.message };
    return { toggled: false, type };
  } else if (existing) {
    // 다른 리액션 → 변경
    let upd = supabase
      .from("reflection_reactions")
      .update({ type })
      .eq("reflection_id", reflectionId)
      .eq("user_id", user.id);
    if (groupId) upd = upd.eq("group_id", groupId);
    const { error } = await upd;
    if (error) return { error: error.message };
    return { toggled: true, type, changed: true };
  } else {
    // 새 리액션
    const row: Record<string, unknown> = { reflection_id: reflectionId, user_id: user.id, type };
    if (groupId) row.group_id = groupId;
    const { error } = await supabase
      .from("reflection_reactions")
      .insert(row);
    if (error) return { error: error.message };

    // 묵상 작성자에게 알림 (본인 제외)
    const { data: reflection } = await supabase
      .from("reflections")
      .select("user_id, day")
      .eq("id", reflectionId)
      .single();

    if (reflection && reflection.user_id !== user.id) {
      const [, { data: actorProfile }, groupResult] = await Promise.all([
        supabase.from("notifications").insert({
          user_id: reflection.user_id,
          type: "amen",
          actor_id: user.id,
          reference_id: reflectionId,
          group_id: groupId ?? null,
          message: type,
        }),
        supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
        groupId ? supabase.from("groups").select("name").eq("id", groupId).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      sendPushToUser(
        reflection.user_id,
        amenPushPayload(actorProfile?.name ?? "누군가", reflection.day, type, groupResult.data?.name)
      ).catch(() => {});
    }

    return { toggled: true, type };
  }
}
