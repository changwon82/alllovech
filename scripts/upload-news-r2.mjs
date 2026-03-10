import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readdir, readFile, stat } from "fs/promises";
import { join, extname } from "path";

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://9cc4c6c71797558c3e147fce207b8e04.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "41c7900e0c91179112fd9281b6fda19f",
    secretAccessKey: "8081c44eac6e340272cfe06b8e3df418de0ebee8bd5e3f589c33adb468836888",
  },
});

const BUCKET = "alllovech-images";

const MIME_TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
  ".pdf": "application/pdf", ".hwp": "application/x-hwp",
  ".zip": "application/zip",
};

async function uploadDir(localDir, r2Prefix, label) {
  const files = await readdir(localDir);
  let uploaded = 0, failed = 0;

  console.log(`[${label}] ${files.length}개 파일...`);

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const filePath = join(localDir, file);
      const s = await stat(filePath);
      if (!s.isFile()) return "skip";
      const ext = extname(file).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const body = await readFile(filePath);
      await R2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${r2Prefix}/${file}`,
        Body: body,
        ContentType: contentType,
      }));
      return "ok";
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value === "ok") uploaded++;
    else if (r.status === "rejected") { failed++; console.error("  실패:", r.reason?.message); }
  }
  console.log(`  완료: ${uploaded}개 업로드, ${failed}개 실패\n`);
}

async function main() {
  console.log("=== 교회소식 첨부파일 → news/ 업로드 ===\n");
  await uploadDir("/Users/ohyeajesus/Downloads/www/data/file/news", "news", "file/news");
}

main().catch(console.error);
