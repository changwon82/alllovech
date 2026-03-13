"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processAndUpload } from "@/lib/upload";

const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";

/** 에디터 인라인 이미지 업로드 (관리자 전용) */
export async function uploadEditorImage(formData: FormData) {
  const { user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const admin = createAdminClient();
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "ADMIN")
    .maybeSingle();
  if (!role) return { error: "권한이 없습니다." };

  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "파일이 없습니다." };

  const folder = (formData.get("folder") as string) || "editor";
  const ext = file.name.split(".").pop() || "jpg";
  const keyBase = `${folder}/inline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { r2Key } = await processAndUpload(file, keyBase, ext, "EDITOR_INLINE");
    return { url: `${R2_PUBLIC}/${r2Key}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "업로드 실패";
    return { error: msg };
  }
}
