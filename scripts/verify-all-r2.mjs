import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

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

async function checkExists(key) {
  try {
    await R2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

async function verifyTable(tableName, r2Prefix, label) {
  console.log(`\n=== ${label} (${tableName} → ${r2Prefix}/) ===`);

  // 콘텐츠에서 editor 이미지 추출
  const { data: posts } = await sb
    .from(tableName)
    .select("id, content")
    .not("content", "is", null)
    .like("content", "%/editor/%");

  const fileMap = new Map(); // fileName → postId
  for (const p of posts || []) {
    const regex = /\/editor\/\d+\/([^"'\s>]+)/g;
    let m;
    while ((m = regex.exec(p.content)) !== null) {
      if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(m[1])) {
        fileMap.set(m[1], p.id);
      }
    }
  }

  console.log(`  콘텐츠 이미지: ${fileMap.size}개`);

  // 첨부파일 확인
  const fileTable = tableName.replace("_posts", "_files").replace("gallery_posts", "gallery_images");
  const actualFileTable = tableName === "gallery_posts" ? "gallery_images"
    : tableName === "jubo_posts" ? "jubo_images"
    : "news_files";

  const { data: attachments } = await sb.from(actualFileTable).select("file_name, post_id");
  const attachFiles = new Map();
  for (const a of attachments || []) {
    if (/\.(jpg|jpeg|png|gif|webp|bmp|pdf|hwp|zip)$/i.test(a.file_name)) {
      attachFiles.set(a.file_name, a.post_id);
    }
  }
  console.log(`  첨부파일: ${attachFiles.size}개`);

  // R2 존재 확인
  const allFiles = new Map([...fileMap, ...attachFiles]);
  let ok = 0, missing = 0;
  const missingList = [];
  const BATCH = 20;
  const entries = [...allFiles.entries()];

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async ([fileName, postId]) => {
        const exists = await checkExists(`${r2Prefix}/${fileName}`);
        return { fileName, postId, exists };
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        if (r.value.exists) ok++;
        else { missing++; missingList.push(r.value); }
      }
    }
  }

  console.log(`  확인: ${ok}개 OK, ${missing}개 누락`);
  if (missingList.length > 0) {
    for (const { fileName, postId } of missingList.slice(0, 10)) {
      console.log(`    X ${r2Prefix}/${fileName} (post ${postId})`);
    }
    if (missingList.length > 10) console.log(`    ... 외 ${missingList.length - 10}개`);
  }

  return { ok, missing, missingList };
}

async function main() {
  console.log("=== R2 이미지 전체 검증 ===");

  const gallery = await verifyTable("gallery_posts", "gallery", "갤러리");
  const jubo = await verifyTable("jubo_posts", "jubo", "주보");
  const news = await verifyTable("news_posts", "news", "교회소식");

  console.log("\n=== 요약 ===");
  console.log(`갤러리: ${gallery.ok} OK, ${gallery.missing} 누락`);
  console.log(`주보: ${jubo.ok} OK, ${jubo.missing} 누락`);
  console.log(`교회소식: ${news.ok} OK, ${news.missing} 누락`);

  const totalMissing = gallery.missing + jubo.missing + news.missing;
  if (totalMissing === 0) console.log("\n모든 파일이 정상입니다!");
  else console.log(`\n총 ${totalMissing}개 누락 — 수정 필요`);
}

main().catch(console.error);
