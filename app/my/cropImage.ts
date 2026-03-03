type CropArea = { x: number; y: number; width: number; height: number };

export default function cropImage(
  imageSrc: string,
  cropArea: CropArea,
  outputSize = 256,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 지원 안 됨"));

      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        outputSize,
        outputSize,
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("이미지 변환 실패"));
        },
        "image/webp",
        0.8,
      );
    };
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = imageSrc;
  });
}
