"use server";

import { createClient } from "@/src/lib/supabase/server";

const BUCKET = "spend-report-receipts";

export type ReceiptFile = {
  path: string;
  url: string;
  size?: number;
  width?: number;
  height?: number;
  uploadedAt?: string;
};

/** 리사이즈된 이미지(blob)를 서버 스토리지에 업로드 */
export async function uploadReceiptImage(formData: FormData): Promise<ReceiptFile> {
  const file = formData.get("file") as File | null;
  if (!file?.size) throw new Error("파일이 없습니다.");
  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() === "png" ? "png" : "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: urlData.publicUrl };
}

/** 서버에 있는 영수증 사진 목록 (metadata에 size 있으면 포함) */
export async function listReceiptImages(): Promise<ReceiptFile[]> {
  const supabase = await createClient();
  const { data: list, error } = await supabase.storage.from(BUCKET).list("", { limit: 500 });
  if (error) throw new Error(error.message);
  const files = (list ?? []).filter((f) => f.name);
  return files.map((f) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
    const meta = f.metadata as { size?: number } | undefined;
    const file = f as { created_at?: string; updated_at?: string };
    return {
      path: f.name,
      url: data.publicUrl,
      ...(typeof meta?.size === "number" && meta.size > 0 ? { size: meta.size } : {}),
      ...(file.created_at ? { uploadedAt: file.created_at } : {}),
    };
  });
}

/** 사진 한 개 삭제 */
export async function deleteReceiptImage(path: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

/** 여러 사진 한 번에 삭제 */
export async function deleteReceiptImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}

// ---- 사진 없이 입력 (spend_report 테이블) ----

export type ExpenseRow = {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  created_at: string;
};

export async function saveExpense(data: {
  date: string;
  amount: number;
  description: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("spend_report").insert({
    date: data.date,
    amount: data.amount,
    description: data.description || null,
  });
  if (error) throw new Error(error.message);
}

export async function getExpenses(): Promise<ExpenseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spend_report")
    .select("id, date, amount, description, created_at")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ExpenseRow[];
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("spend_report").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
