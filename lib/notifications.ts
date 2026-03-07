import type { SupabaseClient } from "@supabase/supabase-js";

/** message 필드에서 댓글 ID 분리: "uuid|text" → { commentId, text } */
export function parseCommentMessage(message: string | null): { commentId: string | null; text: string | null } {
  if (!message) return { commentId: null, text: null };
  const idx = message.indexOf("|");
  if (idx === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(message.slice(0, 36))) {
    return { commentId: message.slice(0, 36), text: message.slice(37) };
  }
  return { commentId: null, text: message };
}

export async function getUnreadCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}
