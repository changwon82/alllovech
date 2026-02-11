/** 텍스트 인식 가능 수준으로 리사이즈·압축 (용량 최소화) */
const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.65;

export type ResizedImage = { blob: Blob; width: number; height: number };

export function resizeReceiptImage(file: File): Promise<ResizedImage> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scale = w > MAX_WIDTH ? MAX_WIDTH / w : 1;
      const dw = Math.round(w * scale);
      const dh = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, dw, dh);
      canvas.toBlob(
        (blob) =>
          blob ? resolve({ blob, width: dw, height: dh }) : reject(new Error("toBlob failed")),
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}
