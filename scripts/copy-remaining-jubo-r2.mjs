import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://9cc4c6c71797558c3e147fce207b8e04.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "41c7900e0c91179112fd9281b6fda19f",
    secretAccessKey: "8081c44eac6e340272cfe06b8e3df418de0ebee8bd5e3f589c33adb468836888",
  },
});

const BUCKET = "alllovech-images";
const EDITOR_ROOT = "/Users/ohyeajesus/Downloads/www/data/editor";

// 전체 대상 파일
const listText = await readFile(
  new URL("./jubo-editor-files-in-gallery.txt", import.meta.url),
  "utf-8"
);
const allFiles = new Set(listText.trim().split("\n").filter(Boolean).map(f => f.trim()));

// 로컬에 있는 파일 제외
const localFiles = new Set();
const subdirs = await readdir(EDITOR_ROOT);
for (const sub of subdirs) {
  const subPath = join(EDITOR_ROOT, sub);
  const s = await stat(subPath);
  if (!s.isDirectory()) continue;
  const files = await readdir(subPath);
  for (const f of files) {
    if (allFiles.has(f)) localFiles.add(f);
  }
}

const remaining = [...allFiles].filter(f => !localFiles.has(f));
console.log(`=== gallery/ → jubo/ 복사: ${remaining.length}개 (로컬에 없는 파일) ===\n`);

let copied = 0, failed = 0;
const BATCH = 10;

for (let i = 0; i < remaining.length; i += BATCH) {
  const batch = remaining.slice(i, i + BATCH);
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
    if (r.status === "fulfilled") copied++;
    else failed++;
  }
  if ((i + BATCH) % 100 < BATCH) {
    console.log(`  진행: ${Math.min(i + BATCH, remaining.length)}/${remaining.length}`);
  }
}

console.log(`\n=== 완료: ${copied}개 복사, ${failed}개 실패 ===`);
