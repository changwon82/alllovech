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
const LOCAL_DIR = "/Users/ohyeajesus/Downloads/www/data/file/approval1";

const MIME_TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
  ".pdf": "application/pdf", ".hwp": "application/x-hwp",
  ".zip": "application/zip", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel", ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

async function main() {
  const files = await readdir(LOCAL_DIR);
  console.log(`=== approval1 → approval/ 업로드: ${files.length}개 ===\n`);

  let uploaded = 0, failed = 0;
  const BATCH = 10;

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (file) => {
        const filePath = join(LOCAL_DIR, file);
        const s = await stat(filePath);
        if (!s.isFile()) return "skip";
        const ext = extname(file).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const body = await readFile(filePath);
        await R2.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `approval/${file}`,
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
    if ((i + BATCH) % 200 < BATCH) {
      console.log(`  진행: ${Math.min(i + BATCH, files.length)}/${files.length}`);
    }
  }

  console.log(`\n=== 완료: ${uploaded}개 업로드, ${failed}개 실패 ===`);
}

main().catch(console.error);
