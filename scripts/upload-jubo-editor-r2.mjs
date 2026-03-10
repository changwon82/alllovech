import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile, readdir, stat } from "fs/promises";
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
const EDITOR_ROOT = "/Users/ohyeajesus/Downloads/www/data/editor";

// 주보 콘텐츠에서 참조하는 1,147개 파일명
const TARGET_FILES = new Set();
const listText = await readFile(
  "/Users/ohyeajesus/.claude/projects/-Users-ohyeajesus-Documents-alllovech/abf5df57-a861-4582-89be-1112fe422c7a/tool-results/bpbjld1tb.txt",
  "utf-8"
);
for (const line of listText.trim().split("\n")) {
  if (line.trim()) TARGET_FILES.add(line.trim());
}

const MIME_TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
};

async function main() {
  console.log(`=== 주보 에디터 이미지 → jubo/ 업로드 (${TARGET_FILES.size}개 대상) ===\n`);

  // editor/ 하위 폴더 순회하며 대상 파일 찾기
  const subdirs = await readdir(EDITOR_ROOT);
  const filesToUpload = []; // { localPath, fileName }

  for (const sub of subdirs) {
    const subPath = join(EDITOR_ROOT, sub);
    const s = await stat(subPath);
    if (!s.isDirectory()) continue;

    const files = await readdir(subPath);
    for (const file of files) {
      if (TARGET_FILES.has(file)) {
        filesToUpload.push({ localPath: join(subPath, file), fileName: file });
      }
    }
  }

  console.log(`로컬에서 ${filesToUpload.length}/${TARGET_FILES.size}개 파일 발견\n`);

  let uploaded = 0, failed = 0;
  const BATCH = 10;

  for (let i = 0; i < filesToUpload.length; i += BATCH) {
    const batch = filesToUpload.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async ({ localPath, fileName }) => {
        const ext = extname(fileName).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const body = await readFile(localPath);
        await R2.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `jubo/${fileName}`,
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
    if ((i + BATCH) % 100 < BATCH) {
      console.log(`  진행: ${Math.min(i + BATCH, filesToUpload.length)}/${filesToUpload.length}`);
    }
  }

  console.log(`\n=== 완료: ${uploaded}개 업로드, ${failed}개 실패 ===`);
}

main().catch(console.error);
