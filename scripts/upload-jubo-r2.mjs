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
  ".pdf": "application/pdf",
};

async function uploadDir(localDir, label) {
  const files = await readdir(localDir);
  let uploaded = 0, failed = 0;
  const BATCH = 10;

  console.log(`[${label}] ${files.length}개 파일...`);

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (file) => {
        const filePath = join(localDir, file);
        const s = await stat(filePath);
        if (!s.isFile()) return "skip";
        const ext = extname(file).toLowerCase();
        if (!(ext in MIME_TYPES)) return "skip";
        const body = await readFile(filePath);
        await R2.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `jubo/${file}`,
          Body: body,
          ContentType: MIME_TYPES[ext],
        }));
        return "ok";
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value === "ok") uploaded++;
      else if (r.status === "rejected") { failed++; console.error("  실패:", r.reason?.message); }
    }
    console.log(`  진행: ${Math.min(i + BATCH, files.length)}/${files.length}`);
  }
  console.log(`  완료: ${uploaded}개 업로드, ${failed}개 실패\n`);
  return { uploaded, failed };
}

async function main() {
  console.log("=== 주보 이미지+PDF → jubo/ 업로드 ===\n");

  const r1 = await uploadDir("/Users/ohyeajesus/Downloads/www/data/file/jubo", "file/jubo");
  const r2 = await uploadDir("/Users/ohyeajesus/Downloads/www/data/user/saveDir/board/www126", "board/www126");

  console.log(`=== 전체: ${r1.uploaded + r2.uploaded}개 업로드, ${r1.failed + r2.failed}개 실패 ===`);
}

main().catch(console.error);
