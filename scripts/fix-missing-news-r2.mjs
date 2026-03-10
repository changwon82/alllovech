import { S3Client, CopyObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { readdir, stat } from "fs/promises";
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
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 모든 news 콘텐츠에서 editor 이미지 파일명 추출
const { data: posts } = await sb
  .from("news_posts")
  .select("content")
  .not("content", "is", null)
  .like("content", "%/editor/%");

const allFiles = new Set();
for (const p of posts || []) {
  const regex = /\/editor\/\d+\/([^"'\s>]+)/g;
  let m;
  while ((m = regex.exec(p.content)) !== null) {
    allFiles.add(m[1]);
  }
}

console.log(`교회소식 콘텐츠 이미지: ${allFiles.size}개\n`);

// news/에 없는 파일 찾기
let missing = 0, ok = 0;
const BATCH = 10;
const fileArr = [...allFiles];
const missingFiles = [];

for (let i = 0; i < fileArr.length; i += BATCH) {
  const batch = fileArr.slice(i, i + BATCH);
  const results = await Promise.allSettled(
    batch.map(async (f) => {
      try {
        await R2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: `news/${f}` }));
        return "ok";
      } catch {
        return f;
      }
    })
  );
  for (const r of results) {
    if (r.status === "fulfilled" && r.value === "ok") ok++;
    else if (r.status === "fulfilled") missingFiles.push(r.value);
  }
}

console.log(`news/에 있음: ${ok}개, 없음: ${missingFiles.length}개\n`);

if (missingFiles.length === 0) {
  console.log("누락 파일 없음!");
  process.exit(0);
}

// gallery/에서 복사 시도
let copied = 0, notFound = 0;
for (let i = 0; i < missingFiles.length; i += BATCH) {
  const batch = missingFiles.slice(i, i + BATCH);
  const results = await Promise.allSettled(
    batch.map(async (f) => {
      await R2.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/gallery/${f}`,
        Key: `news/${f}`,
      }));
      return f;
    })
  );
  for (const r of results) {
    if (r.status === "fulfilled") { copied++; console.log("  복사:", r.value); }
    else { notFound++; console.log("  실패 (gallery에도 없음)"); }
  }
}

console.log(`\n완료: ${copied}개 복사, ${notFound}개 실패`);
