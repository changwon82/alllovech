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
const LOCAL_DIR = "/Users/ohyeajesus/Downloads/www/data/user/saveDir/board/www123";

const MIME_TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
};

async function main() {
  const files = await readdir(LOCAL_DIR);
  console.log(`=== www123 → news/ 업로드: ${files.length}개 ===\n`);

  let uploaded = 0, skipped = 0, failed = 0;
  const BATCH = 10;

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (file) => {
        const filePath = join(LOCAL_DIR, file);
        const s = await stat(filePath);
        if (!s.isFile()) return "skip";
        const ext = extname(file).toLowerCase();
        if (!(ext in MIME_TYPES)) return "skip";
        const body = await readFile(filePath);
        await R2.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `news/${file}`,
          Body: body,
          ContentType: MIME_TYPES[ext],
        }));
        return "ok";
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value === "ok") uploaded++;
      else if (r.status === "fulfilled" && r.value === "skip") skipped++;
      else { failed++; console.error("  실패:", r.reason?.message); }
    }
  }

  console.log(`완료: ${uploaded}개 업로드, ${skipped}개 스킵, ${failed}개 실패`);
}

main().catch(console.error);
