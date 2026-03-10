import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://9cc4c6c71797558c3e147fce207b8e04.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "41c7900e0c91179112fd9281b6fda19f",
    secretAccessKey: "8081c44eac6e340272cfe06b8e3df418de0ebee8bd5e3f589c33adb468836888",
  },
});

const BUCKET = "alllovech-images";

async function main() {
  const listText = await readFile(
    new URL("./jubo-editor-files-in-gallery.txt", import.meta.url),
    "utf-8"
  );
  const files = listText.trim().split("\n").filter(Boolean).map(f => f.trim());

  console.log(`=== gallery/에서 주보 관련 파일 ${files.length}개 삭제 ===\n`);

  // S3 DeleteObjects는 한 번에 최대 1,000개
  const BATCH = 1000;
  let deleted = 0, failed = 0;

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const result = await R2.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: batch.map(f => ({ Key: `gallery/${f}` })),
        Quiet: false,
      },
    }));

    deleted += (result.Deleted || []).length;
    const errors = result.Errors || [];
    failed += errors.length;
    for (const err of errors) {
      console.error(`  실패: ${err.Key} - ${err.Message}`);
    }
    console.log(`  진행: ${Math.min(i + BATCH, files.length)}/${files.length}`);
  }

  console.log(`\n=== 완료: ${deleted}개 삭제, ${failed}개 실패 ===`);
}

main().catch(console.error);
