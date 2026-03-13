"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { deleteFromR2, deleteContentImages, deleteRemovedContentImages } from "@/lib/r2";
import { processAndUpload } from "@/lib/upload";

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

// 갤러리 생성
export async function createGalleryPost(
  formData: FormData,
): Promise<{ id?: number; error?: string }> {
  const auth = await checkAdmin();
  if ("error" in auth && !("admin" in auth)) return { error: auth.error };
  const { admin } = auth as { user: { id: string }; admin: ReturnType<typeof createAdminClient> };

  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const content = formData.get("content") as string;
  const postDate = formData.get("post_date") as string;

  if (!title?.trim()) return { error: "제목을 입력해주세요." };
  if (!category) return { error: "카테고리를 선택해주세요." };

  // 게시글 생성
  const { data: post, error: insertErr } = await admin
    .from("gallery_posts")
    .insert({
      title: title.trim(),
      category,
      content: content || "",
      post_date: postDate || new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (insertErr || !post) return { error: insertErr?.message || "생성 실패" };

  // 이미지 업로드
  const files = formData.getAll("images") as File[];
  const validFiles = files.filter((f) => f.size > 0);

  if (validFiles.length > 0) {
    const timestamp = Date.now();
    const imageRecords = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.name.split(".").pop() || "";
      const keyBase = `gallery/${post.id}_${timestamp}_${i}`;
      const { fileName } = await processAndUpload(file, keyBase, ext, "ATTACHMENT");

      imageRecords.push({
        post_id: post.id,
        file_name: fileName,
        original_name: file.name,
        sort_order: i,
      });
    }

    if (imageRecords.length > 0) {
      await admin.from("gallery_images").insert(imageRecords);
    }
  }

  revalidatePath("/gallery");
  return { id: post.id };
}

// 갤러리 수정
export async function updateGalleryPost(
  formData: FormData,
): Promise<{ id?: number; error?: string }> {
  const auth = await checkAdmin();
  if ("error" in auth && !("admin" in auth)) return { error: auth.error };
  const { admin } = auth as { user: { id: string }; admin: ReturnType<typeof createAdminClient> };

  const postId = parseInt(formData.get("id") as string, 10);
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const content = formData.get("content") as string;
  const postDate = formData.get("post_date") as string;

  if (!postId) return { error: "잘못된 요청입니다." };
  if (!title?.trim()) return { error: "제목을 입력해주세요." };
  if (!category) return { error: "카테고리를 선택해주세요." };

  // 구 content 조회 (인라인 이미지 비교용)
  const { data: oldPost } = await admin
    .from("gallery_posts")
    .select("content")
    .eq("id", postId)
    .single();

  // 게시글 수정
  const { error: updateErr } = await admin
    .from("gallery_posts")
    .update({
      title: title.trim(),
      category,
      content: content || "",
      post_date: postDate || new Date().toISOString().slice(0, 10),
    })
    .eq("id", postId);

  if (updateErr) return { error: updateErr.message };

  // 수정 시 빠진 인라인 이미지 R2 삭제
  await deleteRemovedContentImages(oldPost?.content, content);

  // 삭제할 이미지 처리
  const removedImagesRaw = formData.get("removed_images") as string;
  if (removedImagesRaw) {
    const removedImages: string[] = JSON.parse(removedImagesRaw);
    for (const fileName of removedImages) {
      await deleteFromR2(`gallery/${fileName}`);
    }
    await admin
      .from("gallery_images")
      .delete()
      .eq("post_id", postId)
      .in("file_name", removedImages);
  }

  // 새 이미지 업로드
  const files = formData.getAll("images") as File[];
  const validFiles = files.filter((f) => f.size > 0);

  if (validFiles.length > 0) {
    // 기존 이미지 개수 조회 (sort_order 이어붙이기)
    const { count: existingCount } = await admin
      .from("gallery_images")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    const startOrder = existingCount || 0;
    const timestamp = Date.now();
    const imageRecords = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.name.split(".").pop() || "";
      const keyBase = `gallery/${postId}_${timestamp}_${i}`;
      const { fileName } = await processAndUpload(file, keyBase, ext, "ATTACHMENT");

      imageRecords.push({
        post_id: postId,
        file_name: fileName,
        original_name: file.name,
        sort_order: startOrder + i,
      });
    }

    if (imageRecords.length > 0) {
      await admin.from("gallery_images").insert(imageRecords);
    }
  }

  revalidatePath("/gallery");
  revalidatePath(`/gallery/${postId}`);
  return { id: postId };
}

// 갤러리 삭제
export async function deleteGalleryPost(
  postId: number,
): Promise<{ error?: string }> {
  const auth = await checkAdmin();
  if ("error" in auth && !("admin" in auth)) return { error: auth.error };
  const { admin } = auth as { user: { id: string }; admin: ReturnType<typeof createAdminClient> };

  // content 내 인라인 이미지 + 첨부파일 R2 삭제
  const [{ data: post }, { data: images }] = await Promise.all([
    admin.from("gallery_posts").select("content").eq("id", postId).single(),
    admin.from("gallery_images").select("file_name").eq("post_id", postId),
  ]);

  await deleteContentImages(post?.content);

  if (images && images.length > 0) {
    await Promise.all(
      images.map((img) => deleteFromR2(`gallery/${img.file_name}`)),
    );
  }

  // 게시글 삭제 (CASCADE로 gallery_images도 삭제됨)
  const { error } = await admin
    .from("gallery_posts")
    .delete()
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath("/gallery");
  return {};
}
