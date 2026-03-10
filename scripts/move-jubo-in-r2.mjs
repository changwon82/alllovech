import { S3Client, CopyObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
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

  console.log(`=== gallery/ → jubo/ 이동: ${files.length}개 ===\n`);

  // 1단계: 복사 (gallery/ → jubo/)
  let copied = 0, copyFailed = 0;
  const BATCH = 10;
  const copiedFiles = [];

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (f) => {
        await R2.send(new CopyObjectCommand({
          Bucket: BUCKET,
          CopySource: `${BUCKET}/gallery/${f}`,
          Key: `jubo/${f}`,
        }));
        return f;
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") { copied++; copiedFiles.push(r.value); }
      else { copyFailed++; console.error("  복사 실패:", r.reason?.message); }
    }
    if ((i + BATCH) % 100 < BATCH) {
      console.log(`  복사 진행: ${Math.min(i + BATCH, files.length)}/${files.length}`);
    }
  }

  console.log(`\n복사 완료: ${copied}개 성공, ${copyFailed}개 실패\n`);

  // 2단계: 복사 성공한 파일만 gallery/에서 삭제
  if (copiedFiles.length === 0) {
    console.log("복사된 파일이 없어 삭제를 건너뜁니다.");
    return;
  }

  console.log(`gallery/에서 ${copiedFiles.length}개 삭제 중...\n`);
  const DEL_BATCH = 1000;
  let deleted = 0, delFailed = 0;

  for (let i = 0; i < copiedFiles.length; i += DEL_BATCH) {
    const batch = copiedFiles.slice(i, i + DEL_BATCH);
    const result = await R2.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: batch.map(f => ({ Key: `gallery/${f}` })),
        Quiet: false,
      },
    }));
    deleted += (result.Deleted || []).length;
    const errors = result.Errors || [];
    delFailed += errors.length;
    for (const err of errors) {
      console.error(`  삭제 실패: ${err.Key} - ${err.Message}`);
    }
  }

  console.log(`=== 완료: ${copied}개 복사, ${deleted}개 삭제, 실패 ${copyFailed + delFailed}개 ===`);
}

main().catch(console.error);
