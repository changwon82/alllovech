// 파일 크기 제한 (바이트)
export const FILE_SIZE_LIMITS = {
  EDITOR_INLINE: 5 * 1024 * 1024,  // 5MB
  ATTACHMENT: 10 * 1024 * 1024,     // 10MB
  APPROVAL: 20 * 1024 * 1024,       // 20MB
} as const;

// WebP 변환 대상 확장자
export const CONVERTIBLE_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "bmp"]);

export function formatFileSize(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}
