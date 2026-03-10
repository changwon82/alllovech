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

async function uploadDir(localDir) {
  const files = await readdir(localDir);
  let uploaded = 0;
  let failed = 0;

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
      if (r.status === "fulfilled" && r.value === "ok") uploaded++;
      else if (r.status === "rejected") {
        failed++;
        console.error("  실패:", r.reason?.message);
      }
    }

    console.log(`  진행: ${Math.min(i + BATCH, files.length)}/${files.length} (업로드: ${uploaded}, 실패: ${failed})`);
  }

  return { uploaded, failed };
}

async function main() {
  console.log("=== gallery/ 폴더로 합쳐서 업로드 ===\n");

  console.log("[1/2] board/www45 → gallery/");
  const r1 = await uploadDir("/Users/ohyeajesus/Downloads/www/data/user/saveDir/board/www45");
  console.log(`  완료: ${r1.uploaded}개\n`);

  console.log("[2/2] file/gallery → gallery/");
  const r2 = await uploadDir("/Users/ohyeajesus/Downloads/www/data/file/gallery");
  console.log(`  완료: ${r2.uploaded}개\n`);

  console.log(`=== 전체 완료: ${r1.uploaded + r2.uploaded}개 업로드, ${r1.failed + r2.failed}개 실패 ===`);
}

main().catch(console.error);
