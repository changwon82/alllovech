"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadToR2 } from "@/lib/r2";

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
      const itemRows = items.map((item: { item_name: string; standard: string; quantity: number; unit_price: number; note: string }) => ({
        post_id: post.id,
        item_name: item.item_name,
        standard: item.standard || null,
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
      // R2 키: approval/{postId}_{timestamp}_{index}.{ext}
      const r2Key = `approval/${post.id}_${Date.now()}_${i}.${ext}`;

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        await uploadToR2(r2Key, buffer, file.name);

        // file_name에는 R2 키의 approval/ 이후 부분만 저장
        // 상세 페이지에서 R2_APPROVAL + "/" + file_name으로 URL 생성
        fileRows.push({
          post_id: post.id,
          file_name: `${post.id}_${Date.now()}_${i}.${ext}`,
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
