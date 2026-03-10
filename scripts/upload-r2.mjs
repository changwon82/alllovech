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

async function uploadDir(localDir, r2Prefix) {
  const files = await readdir(localDir);
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  // 10개씩 병렬 업로드
  const BATCH = 10;
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (file) => {
        const filePath = join(localDir, file);
        const fileStat = await stat(filePath);
        if (!fileStat.isFile()) return "skip";

        const ext = extname(file).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const key = `${r2Prefix}/${file}`;

        const body = await readFile(filePath);
        await R2.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: body,
            ContentType: contentType,
          })
        );
        return "ok";
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value === "ok") uploaded++;
      else if (r.status === "fulfilled") skipped++;
      else {
        failed++;
        console.error("  실패:", r.reason?.message);
      }
    }

    console.log(`  진행: ${Math.min(i + BATCH, files.length)}/${files.length} (업로드: ${uploaded}, 실패: ${failed})`);
  }

  return { uploaded, skipped, failed };
}

async function main() {
  console.log("=== Cloudflare R2 이미지 업로드 시작 ===\n");

  // 1. 구 카페24 게시판 이미지
  console.log("[1/2] data/user/saveDir/board/www45/ 업로드 중...");
  const r1 = await uploadDir(
    "/Users/ohyeajesus/Downloads/www/data/user/saveDir/board/www45",
    "board/www45"
  );
  console.log(`  완료: ${r1.uploaded}개 업로드, ${r1.failed}개 실패\n`);

  // 2. 그누보드5 갤러리 이미지
  console.log("[2/2] data/file/gallery/ 업로드 중...");
  const r2 = await uploadDir(
    "/Users/ohyeajesus/Downloads/www/data/file/gallery",
    "file/gallery"
  );
  console.log(`  완료: ${r2.uploaded}개 업로드, ${r2.failed}개 실패\n`);

  console.log("=== 전체 완료 ===");
  console.log(`총 업로드: ${r1.uploaded + r2.uploaded}개`);
  console.log(`총 실패: ${r1.failed + r2.failed}개`);
}

main().catch(console.error);
