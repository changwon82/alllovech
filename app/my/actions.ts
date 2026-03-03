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

/** 이전 커스텀 아바타 사진을 Storage에서 삭제 */
async function deleteOldAvatar(supabase: Awaited<ReturnType<typeof getSessionUser>>["supabase"], userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.avatar_url && !profile.avatar_url.startsWith("default:") && !profile.avatar_url.startsWith("variant:")) {
    const { data: files } = await supabase.storage.from("avatars").list(userId);
    if (files?.length) {
      await supabase.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
    }
  }
}

/** 아바타 스타일 설정 (variant:beam 등) 또는 초기화 */
export async function updateAvatar(avatarUrl: string) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  await deleteOldAvatar(supabase, user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl || null })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true, avatarUrl };
}

/** 커스텀 사진 업로드 */
export async function uploadAvatar(formData: FormData) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const file = formData.get("file") as File | null;
  if (!file?.size) return { error: "파일이 없습니다." };

  // 이전 파일 삭제
  const { data: oldFiles } = await supabase.storage.from("avatars").list(user.id);
  if (oldFiles?.length) {
    await supabase.storage.from("avatars").remove(oldFiles.map((f) => `${user.id}/${f.name}`));
  }

  // 새 파일 업로드
  const path = `${user.id}/${Date.now()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: "image/webp", upsert: false });
  if (uploadError) return { error: uploadError.message };

  // public URL 획득 후 profiles 업데이트
  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_url: urlData.publicUrl })
    .eq("id", user.id);

  if (dbError) return { error: dbError.message };
  return { success: true, avatarUrl: urlData.publicUrl };
}
