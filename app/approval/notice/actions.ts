"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { deleteFromR2, deleteContentImages, deleteRemovedContentImages } from "@/lib/r2";
import { processAndUpload } from "@/lib/upload";
import { todayKST } from "@/lib/date";

async function getNextNoticeOrder(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin
    .from("approval_notice_posts")
    .select("notice_order")
    .eq("is_notice", true)
    .order("notice_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.notice_order || 0) + 1;
}

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

export async function createNoticePost(
  formData: FormData,
): Promise<{ id?: number; error?: string }> {
  const auth = await checkAdmin();
  if ("error" in auth && !("admin" in auth)) return { error: auth.error };
  const { admin } = auth as { user: { id: string }; admin: ReturnType<typeof createAdminClient> };

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const postDate = formData.get("post_date") as string;
  const author = (formData.get("author") as string) || "다애교회";
  const isNotice = formData.get("is_notice") === "true";

  if (!title?.trim()) return { error: "제목을 입력해주세요." };

  const noticeOrder = isNotice ? await getNextNoticeOrder(admin) : 0;

  const { data: post, error: insertErr } = await admin
    .from("approval_notice_posts")
    .insert({
      title: title.trim().normalize("NFC"),
      content: (content || "").normalize("NFC"),
      post_date: postDate || todayKST(),
      author,
      is_notice: isNotice,
      notice_order: noticeOrder,
    })
    .select("id")
    .single();

  if (insertErr || !post) return { error: insertErr?.message || "생성 실패" };

  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f.size > 0);

  if (validFiles.length > 0) {
    const timestamp = Date.now();
    const fileRecords = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.name.split(".").pop() || "";
      const keyBase = `approval/notice/${post.id}_${timestamp}_${i}`;
      const { fileName } = await processAndUpload(file, keyBase, ext, "ATTACHMENT");

      fileRecords.push({
        post_id: post.id,
        file_name: fileName,
        original_name: file.name,
        sort_order: i,
      });
    }

    if (fileRecords.length > 0) {
      await admin.from("approval_notice_files").insert(fileRecords);
    }
  }

  revalidatePath("/approval/notice");
  return { id: post.id };
}

export async function updateNoticePost(
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
  const isNotice = formData.get("is_notice") === "true";

  if (!postId) return { error: "잘못된 요청입니다." };
  if (!title?.trim()) return { error: "제목을 입력해주세요." };

  const { data: oldPost } = await admin
    .from("approval_notice_posts")
    .select("content, is_notice, notice_order")
    .eq("id", postId)
    .single();

  // 공지 전환 시 notice_order 자동 관리
  let noticeOrder = oldPost?.notice_order || 0;
  if (isNotice && !oldPost?.is_notice) {
    // 일반 → 공지: 맨 뒤에 추가
    noticeOrder = await getNextNoticeOrder(admin);
  } else if (!isNotice && oldPost?.is_notice) {
    // 공지 → 일반: 순서 초기화
    noticeOrder = 0;
  }

  const { error: updateErr } = await admin
    .from("approval_notice_posts")
    .update({
      title: title.trim().normalize("NFC"),
      content: (content || "").normalize("NFC"),
      post_date: postDate || todayKST(),
      author,
      is_notice: isNotice,
      notice_order: noticeOrder,
    })
    .eq("id", postId);

  if (updateErr) return { error: updateErr.message };

  await deleteRemovedContentImages(oldPost?.content, content);

  const removedFilesRaw = formData.get("removed_files") as string;
  if (removedFilesRaw) {
    const removedFiles: string[] = JSON.parse(removedFilesRaw);
    for (const fileName of removedFiles) {
      await deleteFromR2(`approval/notice/${fileName}`);
    }
    await admin
      .from("approval_notice_files")
      .delete()
      .eq("post_id", postId)
      .in("file_name", removedFiles);
  }

  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f.size > 0);

  if (validFiles.length > 0) {
    const { count: existingCount } = await admin
      .from("approval_notice_files")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    const startOrder = existingCount || 0;
    const timestamp = Date.now();
    const fileRecords = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.name.split(".").pop() || "";
      const keyBase = `approval/notice/${postId}_${timestamp}_${i}`;
      const { fileName } = await processAndUpload(file, keyBase, ext, "ATTACHMENT");

      fileRecords.push({
        post_id: postId,
        file_name: fileName,
        original_name: file.name,
        sort_order: startOrder + i,
      });
    }

    if (fileRecords.length > 0) {
      await admin.from("approval_notice_files").insert(fileRecords);
    }
  }

  revalidatePath("/approval/notice");
  revalidatePath(`/approval/notice/${postId}`);
  return { id: postId };
}

export async function deleteNoticePost(
  postId: number,
): Promise<{ error?: string }> {
  const auth = await checkAdmin();
  if ("error" in auth && !("admin" in auth)) return { error: auth.error };
  const { admin } = auth as { user: { id: string }; admin: ReturnType<typeof createAdminClient> };

  const [{ data: post }, { data: files }] = await Promise.all([
    admin.from("approval_notice_posts").select("content").eq("id", postId).single(),
    admin.from("approval_notice_files").select("file_name").eq("post_id", postId),
  ]);

  await deleteContentImages(post?.content);

  if (files && files.length > 0) {
    await Promise.all(
      files.map((f) => deleteFromR2(`approval/notice/${f.file_name}`)),
    );
  }

  const { error } = await admin
    .from("approval_notice_posts")
    .delete()
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath("/approval/notice");
  return {};
}
