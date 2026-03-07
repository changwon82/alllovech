"use server";

import { requireAdmin } from "@/lib/admin";

export type ContactItem = {
  id: string;
  actor_id: string | null;
  actor_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
  imageUrls: string[];
};

export type StorageImage = {
  name: string;
  url: string;
  created_at: string;
};

export async function getContactImages(): Promise<StorageImage[]> {
  const { admin } = await requireAdmin();

  const { data: files } = await admin.storage.from("contact-images").list("", {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (!files || files.length === 0) return [];

  return files
    .filter((f) => !f.id?.startsWith("."))
    .map((f) => {
      const { data } = admin.storage.from("contact-images").getPublicUrl(f.name);
      return {
        name: f.name,
        url: data.publicUrl,
        created_at: f.created_at ?? "",
      };
    });
}

export async function deleteContact(contactId: string, imageUrls: string[]): Promise<{ success?: boolean; error?: string }> {
  const { admin } = await requireAdmin();

  // 첨부 이미지 스토리지 삭제
  if (imageUrls.length > 0) {
    const fileNames = imageUrls
      .map((url) => url.split("/contact-images/").pop())
      .filter(Boolean) as string[];
    if (fileNames.length > 0) {
      await admin.storage.from("contact-images").remove(fileNames);
    }
  }

  // 같은 문의의 모든 알림 삭제 (관리자별로 중복 생성되므로)
  // actor_id + created_at 기준으로 매칭
  const { data: target } = await admin
    .from("notifications")
    .select("actor_id, created_at")
    .eq("id", contactId)
    .single();

  if (target) {
    await admin
      .from("notifications")
      .delete()
      .eq("type", "contact")
      .eq("actor_id", target.actor_id)
      .eq("created_at", target.created_at);
  } else {
    await admin.from("notifications").delete().eq("id", contactId);
  }

  return { success: true };
}

export async function deleteContactImage(fileName: string): Promise<{ success?: boolean; error?: string }> {
  const { admin } = await requireAdmin();

  const { error } = await admin.storage.from("contact-images").remove([fileName]);
  if (error) return { error: error.message };

  return { success: true };
}

export async function getContacts(): Promise<ContactItem[]> {
  const { admin } = await requireAdmin();

  const { data: notifications } = await admin
    .from("notifications")
    .select("id, actor_id, message, is_read, created_at")
    .eq("type", "contact")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (notifications ?? []) as {
    id: string;
    actor_id: string | null;
    message: string | null;
    is_read: boolean;
    created_at: string;
  }[];

  // actor 이름 조회
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
  const nameMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await admin.from("profiles").select("id, name").in("id", actorIds);
    for (const p of (profiles ?? []) as { id: string; name: string }[]) {
      nameMap.set(p.id, p.name);
    }
  }

  // 같은 actor + 같은 시간(±1초) 문의는 중복 → 가장 먼저 나온 것만 표시
  const seen = new Set<string>();

  return rows
    .filter((r) => {
      const key = `${r.actor_id}_${new Date(r.created_at).toISOString().slice(0, 19)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((r) => {
      // message에서 이미지 URL 분리
      const lines = (r.message ?? "").split("\n");
      const imageUrls: string[] = [];
      const textLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith("http") && (line.includes("/contact-images/") || line.includes("supabase"))) {
          imageUrls.push(line.trim());
        } else {
          textLines.push(line);
        }
      }
      return {
        id: r.id,
        actor_id: r.actor_id,
        actor_name: r.actor_id ? (nameMap.get(r.actor_id) ?? "이름 없음") : "알 수 없음",
        message: textLines.join("\n").trim(),
        is_read: r.is_read,
        created_at: r.created_at,
        imageUrls,
      };
    });
}
