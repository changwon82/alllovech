"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";

export async function submitApproval(formData: FormData) {
  const { user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const admin = createAdminClient();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const docCategory = formData.get("doc_category") as string;
  const approver1MbId = formData.get("approver1_mb_id") as string;
  const approver2MbId = (formData.get("approver2_mb_id") as string) || null;
  const amount = parseInt(formData.get("amount") as string, 10) || 0;
  const accountName = (formData.get("account_name") as string) || null;
  const refDepartment = (formData.get("ref_department") as string) || null;
  const refMembersJson = (formData.get("ref_members") as string) || null;
  const itemsJson = formData.get("items") as string;

  if (!title || !docCategory || !approver1MbId) {
    return { error: "필수 항목을 입력해주세요." };
  }

  // 작성자 프로필 조회
  const { data: profile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  // 게시글 생성
  const { data: post, error: postError } = await admin
    .from("approval_posts")
    .insert({
      title,
      content: content || null,
      doc_category: docCategory,
      author_name: profile?.name || user.email,
      author_mb_id: user.id,
      requester_mb_id: user.id,
      approver1_mb_id: approver1MbId,
      approver1_status: "0|0",
      approver2_mb_id: approver2MbId,
      approver2_status: approver2MbId ? "0|0" : null,
      finance_status: "0|0",
      payment_status: "0|0",
      amount,
      account_name: accountName,
      ref_department: refDepartment,
      ref_members: refMembersJson,
      doc_status: "draft",
      post_date: new Date().toISOString(),
      hit_count: 0,
    })
    .select("id")
    .single();

  if (postError || !post) {
    return { error: postError?.message || "저장 실패" };
  }

  // 세부항목 저장
  try {
    const items = JSON.parse(itemsJson || "[]");
    if (items.length > 0) {
      const itemRows = items.map((item: { item_name: string; quantity: number; unit_price: number; note: string }) => ({
        post_id: post.id,
        item_name: item.item_name,
        standard: null,
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        total_price: (item.quantity || 0) * (item.unit_price || 0),
        note: item.note || null,
      }));
      await admin.from("approval_items").insert(itemRows);
    }
  } catch {
    // 세부항목 파싱 실패해도 게시글은 저장됨
  }

  // 첨부파일 → Cloudflare R2 업로드
  const fileEntries = formData.getAll("files") as File[];
  if (fileEntries.length > 0) {
    const fileRows: { post_id: number; file_name: string; original_name: string; sort_order: number }[] = [];

    for (let i = 0; i < fileEntries.length; i++) {
      const file = fileEntries[i];
      if (!file || !file.name || file.size === 0) continue;

      const ext = file.name.split(".").pop() || "bin";
      const ts = Date.now();
      const fileName = `${post.id}_${ts}_${i}.${ext}`;
      const r2Key = `approval/${fileName}`;

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        await uploadToR2(r2Key, buffer, file.name);

        fileRows.push({
          post_id: post.id,
          file_name: fileName,
          original_name: file.name,
          sort_order: i,
        });
      } catch (err) {
        console.error(`파일 업로드 실패: ${file.name}`, err);
      }
    }

    if (fileRows.length > 0) {
      await admin.from("approval_files").insert(fileRows);
    }
  }

  return { id: post.id };
}

export async function updateApproval(formData: FormData) {
  const { user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const admin = createAdminClient();
  const postId = parseInt(formData.get("post_id") as string, 10);

  // 권한 확인 (작성자 또는 관리자)
  const [{ data: post }, { data: roles }] = await Promise.all([
    admin.from("approval_posts").select("requester_mb_id").eq("id", postId).single(),
    admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "ADMIN").maybeSingle(),
  ]);
  if (!post) return { error: "문서를 찾을 수 없습니다." };
  if (!roles && post.requester_mb_id !== user.id) return { error: "수정 권한이 없습니다." };

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const docCategory = formData.get("doc_category") as string;
  const approver1MbId = formData.get("approver1_mb_id") as string;
  const approver2MbId = (formData.get("approver2_mb_id") as string) || null;
  const amount = parseInt(formData.get("amount") as string, 10) || 0;
  const accountName = (formData.get("account_name") as string) || null;
  const refDepartment = (formData.get("ref_department") as string) || null;
  const refMembersJson = (formData.get("ref_members") as string) || null;
  const itemsJson = formData.get("items") as string;

  if (!title || !docCategory || !approver1MbId) {
    return { error: "필수 항목을 입력해주세요." };
  }

  // 게시글 수정
  const { error: updateError } = await admin
    .from("approval_posts")
    .update({
      title,
      content: content || null,
      doc_category: docCategory,
      approver1_mb_id: approver1MbId,
      approver2_mb_id: approver2MbId,
      approver2_status: approver2MbId ? "0|0" : null,
      amount,
      account_name: accountName,
      ref_department: refDepartment,
      ref_members: refMembersJson,
    })
    .eq("id", postId);

  if (updateError) return { error: updateError.message };

  // 세부항목: 기존 삭제 후 재삽입
  await admin.from("approval_items").delete().eq("post_id", postId);
  try {
    const items = JSON.parse(itemsJson || "[]");
    if (items.length > 0) {
      const itemRows = items.map((item: { item_name: string; quantity: number; unit_price: number; note: string }) => ({
        post_id: postId,
        item_name: item.item_name,
        standard: null,
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        total_price: (item.quantity || 0) * (item.unit_price || 0),
        note: item.note || null,
      }));
      await admin.from("approval_items").insert(itemRows);
    }
  } catch {
    // 파싱 실패 무시
  }

  // 삭제된 기존 파일 처리
  const removedFilesJson = (formData.get("removed_files") as string) || null;
  if (removedFilesJson) {
    try {
      const removedFiles: string[] = JSON.parse(removedFilesJson);
      await Promise.all(
        removedFiles.map((fn) => deleteFromR2(`approval/${fn}`).catch(() => {})),
      );
      for (const fn of removedFiles) {
        await admin.from("approval_files").delete().eq("post_id", postId).eq("file_name", fn);
      }
    } catch {
      // 무시
    }
  }

  // 새 파일 업로드
  const fileEntries = formData.getAll("files") as File[];
  if (fileEntries.length > 0) {
    const { data: existingCount } = await admin
      .from("approval_files")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);
    let sortStart = existingCount ? (existingCount as unknown as number) : 0;

    const fileRows: { post_id: number; file_name: string; original_name: string; sort_order: number }[] = [];

    for (let i = 0; i < fileEntries.length; i++) {
      const file = fileEntries[i];
      if (!file || !file.name || file.size === 0) continue;

      const ext = file.name.split(".").pop() || "bin";
      const ts = Date.now();
      const fileName = `${postId}_${ts}_${i}.${ext}`;
      const r2Key = `approval/${fileName}`;

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        await uploadToR2(r2Key, buffer, file.name);
        fileRows.push({
          post_id: postId,
          file_name: fileName,
          original_name: file.name,
          sort_order: sortStart + i,
        });
      } catch (err) {
        console.error(`파일 업로드 실패: ${file.name}`, err);
      }
    }

    if (fileRows.length > 0) {
      await admin.from("approval_files").insert(fileRows);
    }
  }

  return { id: postId };
}
