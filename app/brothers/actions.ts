"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { deleteContentImages, deleteRemovedContentImages } from "@/lib/r2";

// 관리자 권한 확인
async function checkAdmin() {
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
  return { user, admin };
}

// 교우소식 생성
export async function createBrothersPost(
  formData: FormData,
): Promise<{ id?: number; error?: string }> {
  const auth = await checkAdmin();
  if ("error" in auth && !("admin" in auth)) return { error: auth.error };
  const { admin } = auth as { user: { id: string }; admin: ReturnType<typeof createAdminClient> };

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const postDate = formData.get("post_date") as string;
  const author = (formData.get("author") as string) || "다애교회";

  if (!title?.trim()) return { error: "제목을 입력해주세요." };

  const { data: post, error: insertErr } = await admin
    .from("brothers_posts")
    .insert({
      title: title.trim(),
      content: content || "",
      post_date: postDate || new Date().toISOString().slice(0, 10),
      author,
    })
    .select("id")
    .single();

  if (insertErr || !post) return { error: insertErr?.message || "생성 실패" };

  revalidatePath("/brothers");
  return { id: post.id };
}

// 교우소식 수정
export async function updateBrothersPost(
  formData: FormData,
): Promise<{ id?: number; error?: string }> {
  const auth = await checkAdmin();
  if ("error" in auth && !("admin" in auth)) return { error: auth.error };
  const { admin } = auth as { user: { id: string }; admin: ReturnType<typeof createAdminClient> };

  const postId = parseInt(formData.get("id") as string, 10);
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const postDate = formData.get("post_date") as string;
  const author = (formData.get("author") as string) || "다애교회";

  if (!postId) return { error: "잘못된 요청입니다." };
  if (!title?.trim()) return { error: "제목을 입력해주세요." };

  // 구 content 조회 (인라인 이미지 비교용)
  const { data: oldPost } = await admin
    .from("brothers_posts")
    .select("content")
    .eq("id", postId)
    .single();

  const { error: updateErr } = await admin
    .from("brothers_posts")
    .update({
      title: title.trim(),
      content: content || "",
      post_date: postDate || new Date().toISOString().slice(0, 10),
      author,
    })
    .eq("id", postId);

  if (updateErr) return { error: updateErr.message };

  // 수정 시 빠진 인라인 이미지 R2 삭제
  await deleteRemovedContentImages(oldPost?.content, content);

  revalidatePath("/brothers");
  revalidatePath(`/brothers/${postId}`);
  return { id: postId };
}

// 교우소식 삭제
export async function deleteBrothersPost(
  postId: number,
): Promise<{ error?: string }> {
  const auth = await checkAdmin();
  if ("error" in auth && !("admin" in auth)) return { error: auth.error };
  const { admin } = auth as { user: { id: string }; admin: ReturnType<typeof createAdminClient> };

  // content 내 인라인 이미지 R2 삭제
  const { data: post } = await admin
    .from("brothers_posts")
    .select("content")
    .eq("id", postId)
    .single();

  await deleteContentImages(post?.content);

  const { error } = await admin
    .from("brothers_posts")
    .delete()
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath("/brothers");
  return {};
}
