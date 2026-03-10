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
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

const EDITOR_DIR = "/Users/ohyeajesus/Downloads/www/data/editor";

async function main() {
  console.log("=== editor/ → gallery/ 업로드 ===\n");

  const subDirs = await readdir(EDITOR_DIR);
  let totalUploaded = 0;
  let totalFailed = 0;

  for (const sub of subDirs) {
    const subPath = join(EDITOR_DIR, sub);
    const s = await stat(subPath);
    if (!s.isDirectory()) continue;

    const files = await readdir(subPath);
    const imageFiles = files.filter((f) => {
      const ext = extname(f).toLowerCase();
      return ext in MIME_TYPES;
    });

    if (imageFiles.length === 0) continue;

    console.log(`[${sub}] ${imageFiles.length}개 파일...`);

    const BATCH = 10;
    for (let i = 0; i < imageFiles.length; i += BATCH) {
      const batch = imageFiles.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async (file) => {
          const filePath = join(subPath, file);
          const ext = extname(file).toLowerCase();
          const contentType = MIME_TYPES[ext] || "application/octet-stream";
          const body = await readFile(filePath);

          await R2.send(
            new PutObjectCommand({
              Bucket: BUCKET,
              Key: `gallery/${file}`,
              Body: body,
              ContentType: contentType,
            })
          );
          return "ok";
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value === "ok") totalUploaded++;
        else {
          totalFailed++;
          console.error("  실패:", r.reason?.message);
        }
      }
    }

    console.log(`  완료 (누적: ${totalUploaded}개)`);
  }

  console.log(`\n=== 전체 완료: ${totalUploaded}개 업로드, ${totalFailed}개 실패 ===`);
}

main().catch(console.error);
