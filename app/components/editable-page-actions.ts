"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function savePage(slug: string, content: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const roles = await getUserRoles(supabase, user.id);
  if (!isAdminRole(roles)) return { error: "관리자 권한이 필요합니다." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("pages")
    .upsert(
      {
        slug,
        content,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "slug" }
    );

  if (error) return { error: error.message };
  return { content };
}

export async function getPage(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("pages")
    .select("content, updated_at")
    .eq("slug", slug)
    .single();
  return data;
}
