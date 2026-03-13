import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
  pdf: "application/pdf", hwp: "application/x-hwp",
  zip: "application/zip", rar: "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

// R2에 파일 업로드 → 저장된 key 반환
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  fileName: string,
): Promise<void> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

// R2에서 파일 삭제
export async function deleteFromR2(key: string): Promise<void> {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    }),
  );
}

const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";

/** content HTML에서 R2 이미지 URL을 추출하여 R2에서 삭제 */
export async function deleteContentImages(content: string | null): Promise<void> {
  if (!content) return;

  const regex = /src=["']+([^"']+)["']+/g;
  const keys: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const url = match[1];
    if (!url.startsWith(R2_PUBLIC)) continue;
    // URL: https://pub-xxx.r2.dev/gallery/inline_xxx.jpg → key: gallery/inline_xxx.jpg
    const key = url.slice(R2_PUBLIC.length + 1);
    if (key) keys.push(key);
  }

  if (keys.length > 0) {
    await Promise.all(keys.map((k) => deleteFromR2(k)));
  }
}
