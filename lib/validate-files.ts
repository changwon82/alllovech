import { FILE_SIZE_LIMITS, formatFileSize } from "./upload-constants";

type SizeLimitKey = keyof typeof FILE_SIZE_LIMITS;

/** 크기 초과 파일명 배열 반환 (빈 배열 = 통과) */
export function validateFileSize(files: File[], limitKey: SizeLimitKey): string[] {
  const limit = FILE_SIZE_LIMITS[limitKey];
  return files
    .filter((f) => f.size > limit)
    .map((f) => `${f.name} (${formatFileSize(f.size)})`);
}

/** 초과 파일 경고 메시지 */
export function fileSizeWarning(overFiles: string[], limitKey: SizeLimitKey): string {
  const limit = FILE_SIZE_LIMITS[limitKey];
  return `파일 크기 제한(${formatFileSize(limit)})을 초과했습니다:\n${overFiles.join("\n")}`;
}
