"use server";

import { requireAdmin } from "@/lib/admin";
import { listR2Objects, listAllR2Objects, deleteFromR2, uploadToR2, moveR2Object } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";

// ── 기본 CRUD ──

export async function listFiles(prefix: string, token?: string) {
  await requireAdmin();
  return listR2Objects(prefix, token);
}

export async function deleteFile(key: string): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    await deleteFromR2(key);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "삭제 실패" };
  }
}

export async function uploadFile(
  formData: FormData,
  folder: string,
): Promise<{ key?: string; error?: string }> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "파일이 없습니다" };

  const prefix = folder ? `${folder}/` : "";
  const key = `${prefix}${file.name}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.name);
    return { key };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "업로드 실패" };
  }
}

// ── 1. 폴더별 요약 ──

export type FolderSummary = {
  folder: string;
  fileCount: number;
  totalSize: number;
};

export async function getFolderSummaries(): Promise<FolderSummary[]> {
  await requireAdmin();

  // 루트 폴더 목록 조회
  const { folders } = await listR2Objects("");

  const summaries = await Promise.all(
    folders.map(async (folder) => {
      const objects = await listAllR2Objects(folder);
      return {
        folder: folder.replace(/\/$/, ""),
        fileCount: objects.length,
        totalSize: objects.reduce((sum, o) => sum + o.size, 0),
      };
    }),
  );

  return summaries.sort((a, b) => b.totalSize - a.totalSize);
}

// ── 2. 검색 ──

export async function searchFiles(query: string) {
  await requireAdmin();
  if (!query.trim()) return [];

  const all = await listAllR2Objects("");
  const q = query.toLowerCase();
  return all
    .filter((o) => o.key.toLowerCase().includes(q))
    .slice(0, 200); // 최대 200개
}

// ── 3. 고아 파일 탐지 ──

const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";

/** content HTML에서 R2 key 추출 */
function extractKeysFromContent(content: string | null): string[] {
  if (!content) return [];
  const regex = /src=["']+([^"']+)["']+/g;
  const keys: string[] = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    if (!m[1].startsWith(R2_PUBLIC)) continue;
    const key = m[1].slice(R2_PUBLIC.length + 1);
    if (key) keys.push(key);
  }
  return keys;
}

/** Supabase에서 1000행 제한 회피 — 페이지네이션 조회 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll(query: any): Promise<any[]> {
  const all: unknown[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await query.range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export type OrphanResult = {
  folder: string;
  orphanKeys: string[];
  totalOrphans: number;
  totalFiles: number;
};

export async function findOrphanFiles(): Promise<OrphanResult[]> {
  const { admin } = await requireAdmin();

  const results: OrphanResult[] = [];

  // gallery/
  {
    const r2Objects = await listAllR2Objects("gallery/");
    const r2Keys = new Set(r2Objects.map((o) => o.key));

    // DB: gallery_images
    const images = await fetchAll(
      admin.from("gallery_images").select("file_name"),
    );
    const dbKeys = new Set(images.map((i: { file_name: string }) => `gallery/${i.file_name}`));

    // DB: content inline images
    const posts = await fetchAll(
      admin.from("gallery_posts").select("content"),
    );
    for (const p of posts as { content: string | null }[]) {
      for (const k of extractKeysFromContent(p.content)) dbKeys.add(k);
    }

    const orphans = [...r2Keys].filter((k) => !dbKeys.has(k));
    results.push({ folder: "gallery", orphanKeys: orphans, totalOrphans: orphans.length, totalFiles: r2Objects.length });
  }

  // jubo/
  {
    const r2Objects = await listAllR2Objects("jubo/");
    const r2Keys = new Set(r2Objects.map((o) => o.key));

    const images = await fetchAll(
      admin.from("jubo_images").select("file_name"),
    );
    const dbKeys = new Set(images.map((i: { file_name: string }) => `jubo/${i.file_name}`));

    const posts = await fetchAll(
      admin.from("jubo_posts").select("content"),
    );
    for (const p of posts as { content: string | null }[]) {
      for (const k of extractKeysFromContent(p.content)) dbKeys.add(k);
    }

    const orphans = [...r2Keys].filter((k) => !dbKeys.has(k));
    results.push({ folder: "jubo", orphanKeys: orphans, totalOrphans: orphans.length, totalFiles: r2Objects.length });
  }

  // news/
  {
    const r2Objects = await listAllR2Objects("news/");
    const r2Keys = new Set(r2Objects.map((o) => o.key));

    const files = await fetchAll(
      admin.from("news_files").select("file_name"),
    );
    const dbKeys = new Set(files.map((f: { file_name: string }) => `news/${f.file_name}`));

    const posts = await fetchAll(
      admin.from("news_posts").select("content"),
    );
    for (const p of posts as { content: string | null }[]) {
      for (const k of extractKeysFromContent(p.content)) dbKeys.add(k);
    }

    const orphans = [...r2Keys].filter((k) => !dbKeys.has(k));
    results.push({ folder: "news", orphanKeys: orphans, totalOrphans: orphans.length, totalFiles: r2Objects.length });
  }

  // brothers/
  {
    const r2Objects = await listAllR2Objects("brothers/");
    const r2Keys = new Set(r2Objects.map((o) => o.key));

    const dbKeys = new Set<string>();
    const posts = await fetchAll(
      admin.from("brothers_posts").select("content"),
    );
    for (const p of posts as { content: string | null }[]) {
      for (const k of extractKeysFromContent(p.content)) dbKeys.add(k);
    }

    const orphans = [...r2Keys].filter((k) => !dbKeys.has(k));
    results.push({ folder: "brothers", orphanKeys: orphans, totalOrphans: orphans.length, totalFiles: r2Objects.length });
  }

  // approval/
  {
    const r2Objects = await listAllR2Objects("approval/");
    const r2Keys = new Set(r2Objects.map((o) => o.key));

    const dbKeys = new Set<string>();

    const files = await fetchAll(
      admin.from("approval_files").select("file_name"),
    );
    for (const f of files as { file_name: string }[]) dbKeys.add(`approval/${f.file_name}`);

    // content 인라인 이미지
    const posts = await fetchAll(
      admin.from("approval_posts").select("content"),
    );
    for (const p of posts as { content: string | null }[]) {
      for (const k of extractKeysFromContent(p.content)) dbKeys.add(k);
    }

    const orphans = [...r2Keys].filter((k) => !dbKeys.has(k));
    results.push({ folder: "approval", orphanKeys: orphans, totalOrphans: orphans.length, totalFiles: r2Objects.length });
  }

  // site/ — staff photos + admin_settings + 소스코드 하드코딩 이미지
  {
    const r2Objects = await listAllR2Objects("site/");
    const r2Keys = new Set(r2Objects.map((o) => o.key));

    const dbKeys = new Set<string>();

    // staff photo_url
    const staff = await fetchAll(
      admin.from("staff").select("photo_url"),
    );
    for (const s of staff as { photo_url: string | null }[]) {
      if (s.photo_url?.startsWith(R2_PUBLIC)) {
        dbKeys.add(s.photo_url.slice(R2_PUBLIC.length + 1));
      }
    }

    // admin_settings — hero_slides 등의 이미지 URL
    const { data: settings } = await admin.from("admin_settings").select("value");
    for (const s of settings || []) {
      const regex = new RegExp(`${R2_PUBLIC.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^"'\\s]+)`, "g");
      let m;
      while ((m = regex.exec(s.value)) !== null) {
        dbKeys.add(m[1]);
      }
    }

    // 소스코드에서 하드코딩된 이미지 (about 페이지, founder 페이지 등)
    const HARDCODED_SITE_KEYS = [
      "site/about/letter.jpg",
      "site/about/building.jpg",
      "site/about/parent-teacher.jpg",
      "site/about/multicultural.jpg",
      "site/about/ezemiah.jpg",
      "site/about/sumba.jpg",
      "site/about/parking.jpg",
      "site/about/parking-nonghyup.png",
      "site/pastor.png",
    ];
    for (const k of HARDCODED_SITE_KEYS) dbKeys.add(k);

    const orphans = [...r2Keys].filter((k) => !dbKeys.has(k));
    results.push({ folder: "site", orphanKeys: orphans, totalOrphans: orphans.length, totalFiles: r2Objects.length });
  }

  return results.filter((r) => r.totalFiles > 0);
}

// ── 4. 고아 파일 lost_folder로 이동 ──

export type MoveOrphansResult = {
  folder: string;
  moved: number;
  failed: number;
};

/** 고아 파일들을 lost_folder/{원본폴더}/ 로 이동 */
export async function moveOrphansToLostFolder(
  orphanKeys: string[],
): Promise<MoveOrphansResult[]> {
  await requireAdmin();

  // 폴더별 그룹핑
  const byFolder = new Map<string, string[]>();
  for (const key of orphanKeys) {
    const folder = key.split("/")[0];
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder)!.push(key);
  }

  const results: MoveOrphansResult[] = [];

  for (const [folder, keys] of byFolder) {
    let moved = 0;
    let failed = 0;

    // 10개씩 병렬 처리
    for (let i = 0; i < keys.length; i += 10) {
      const batch = keys.slice(i, i + 10);
      const batchResults = await Promise.all(
        batch.map(async (key) => {
          // gallery/photo.jpg → lost_folder/gallery/photo.jpg
          const destKey = `lost_folder/${key}`;
          try {
            await moveR2Object(key, destKey);
            return true;
          } catch {
            return false;
          }
        }),
      );
      moved += batchResults.filter(Boolean).length;
      failed += batchResults.filter((r) => !r).length;
    }

    results.push({ folder, moved, failed });
  }

  return results;
}
