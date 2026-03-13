"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { uploadToR2, deleteFromR2, deleteContentImages } from "@/lib/r2";

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

// 교회소식 생성
export async function createNewsPost(
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

  // 게시글 생성
  const { data: post, error: insertErr } = await admin
    .from("news_posts")
    .insert({
      title: title.trim(),
      content: content || "",
      post_date: postDate || new Date().toISOString().slice(0, 10),
      author,
    })
    .select("id")
    .single();

  if (insertErr || !post) return { error: insertErr?.message || "생성 실패" };

  // 파일 업로드
  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f.size > 0);

  if (validFiles.length > 0) {
    const timestamp = Date.now();
    const fileRecords = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.name.split(".").pop() || "";
      const fileName = `${post.id}_${timestamp}_${i}.${ext}`;
      const key = `news/${fileName}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      await uploadToR2(key, buffer, file.name);

      fileRecords.push({
        post_id: post.id,
        file_name: fileName,
        original_name: file.name,
        sort_order: i,
      });
    }

    if (fileRecords.length > 0) {
      await admin.from("news_files").insert(fileRecords);
    }
  }

  revalidatePath("/news");
  return { id: post.id };
}

// 교회소식 수정
export async function updateNewsPost(
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

  // 게시글 수정
  const { error: updateErr } = await admin
    .from("news_posts")
    .update({
      title: title.trim(),
      content: content || "",
      post_date: postDate || new Date().toISOString().slice(0, 10),
      author,
    })
    .eq("id", postId);

  if (updateErr) return { error: updateErr.message };

  // 삭제할 파일 처리
  const removedFilesRaw = formData.get("removed_files") as string;
  if (removedFilesRaw) {
    const removedFiles: string[] = JSON.parse(removedFilesRaw);
    for (const fileName of removedFiles) {
      await deleteFromR2(`news/${fileName}`);
    }
    // DB에서 삭제
    await admin
      .from("news_files")
      .delete()
      .eq("post_id", postId)
      .in("file_name", removedFiles);
  }

  // 새 파일 업로드
  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f.size > 0);

  if (validFiles.length > 0) {
    // 기존 파일 개수 조회 (sort_order 이어붙이기)
    const { count: existingCount } = await admin
      .from("news_files")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    const startOrder = existingCount || 0;
    const timestamp = Date.now();
    const fileRecords = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.name.split(".").pop() || "";
      const fileName = `${postId}_${timestamp}_${i}.${ext}`;
      const key = `news/${fileName}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      await uploadToR2(key, buffer, file.name);

      fileRecords.push({
        post_id: postId,
        file_name: fileName,
        original_name: file.name,
        sort_order: startOrder + i,
      });
    }

    if (fileRecords.length > 0) {
      await admin.from("news_files").insert(fileRecords);
    }
  }

  revalidatePath("/news");
  revalidatePath(`/news/${postId}`);
  return { id: postId };
}

// 교회소식 삭제
export async function deleteNewsPost(
  postId: number,
): Promise<{ error?: string }> {
  const auth = await checkAdmin();
  if ("error" in auth && !("admin" in auth)) return { error: auth.error };
  const { admin } = auth as { user: { id: string }; admin: ReturnType<typeof createAdminClient> };

  // content 내 인라인 이미지 + 첨부파일 R2 삭제
  const [{ data: post }, { data: files }] = await Promise.all([
    admin.from("news_posts").select("content").eq("id", postId).single(),
    admin.from("news_files").select("file_name").eq("post_id", postId),
  ]);

  await deleteContentImages(post?.content);

  if (files && files.length > 0) {
    await Promise.all(
      files.map((f) => deleteFromR2(`news/${f.file_name}`)),
    );
  }

  // 게시글 삭제 (CASCADE로 news_files도 삭제됨)
  const { error } = await admin
    .from("news_posts")
    .delete()
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath("/news");
  return {};
}
