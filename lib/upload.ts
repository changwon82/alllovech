import "server-only";
import sharp from "sharp";
import { uploadToR2 } from "./r2";
import { FILE_SIZE_LIMITS, CONVERTIBLE_IMAGE_EXTS } from "./upload-constants";

type SizeLimitKey = keyof typeof FILE_SIZE_LIMITS;

const THUMB_WIDTH = 400;
const IMAGE_EXTS = new Set([...CONVERTIBLE_IMAGE_EXTS, "webp"]);

/** 원본 R2 key → 썸네일 R2 key 변환 */
export function toThumbKey(key: string): string {
  const parts = key.split("/");
  const fileName = parts.pop()!;
  return [...parts, "_thumb", fileName].join("/");
}

/**
 * 이미지를 WebP로 변환 후 R2에 업로드 + 썸네일 생성
 * - 이미지(jpg/png/gif/bmp) → WebP 변환 후 업로드 + 400px 썸네일
 * - 비이미지(pdf 등) → 그대로 업로드 (썸네일 없음)
 * @returns 실제 저장된 R2 key와 파일명
 */
export async function processAndUpload(
  file: File,
  r2KeyBase: string,   // 확장자 제외한 경로 (예: "gallery/123_1710000_0")
  originalExt: string,
  limitKey: SizeLimitKey,
): Promise<{ r2Key: string; fileName: string }> {
  const limit = FILE_SIZE_LIMITS[limitKey];
  if (file.size > limit) {
    throw new Error(`파일 크기 제한(${Math.round(limit / 1024 / 1024)}MB)을 초과했습니다: ${file.name}`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = originalExt.toLowerCase();

  if (CONVERTIBLE_IMAGE_EXTS.has(ext)) {
    const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
    const r2Key = `${r2KeyBase}.webp`;
    const fileName = r2KeyBase.split("/").pop() + ".webp";

    // 원본 + 썸네일 동시 업로드
    const thumbBuffer = await sharp(buffer).resize(THUMB_WIDTH).webp({ quality: 75 }).toBuffer();
    const thumbKey = toThumbKey(r2Key);

    await Promise.all([
      uploadToR2(r2Key, webpBuffer, fileName),
      uploadToR2(thumbKey, thumbBuffer, fileName),
    ]);

    return { r2Key, fileName };
  }

  const r2Key = `${r2KeyBase}.${ext}`;
  const fileName = r2KeyBase.split("/").pop() + `.${ext}`;
  await uploadToR2(r2Key, buffer, file.name);
  return { r2Key, fileName };
}

/** 이미지 파일인지 확인 */
export function isImageKey(key: string): boolean {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTS.has(ext);
}
