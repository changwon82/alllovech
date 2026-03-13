/**
 * R2에서 approval_notice/ → approval/notice/, approval_notice_editor/ → approval/notice_editor/ 이동
 * 1. 기존 파일 복사 (새 키로)
 * 2. DB file_name 업데이트
 * 3. DB content URL 치환
 * 4. 기존 파일 삭제
 */
import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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
const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0"
);

async function listAllObjects(prefix) {
  const keys = [];
  let token;
  do {
    const res = await R2.send(new ListObjectsV2Command({
      Bucket: BUCKET, Prefix: prefix, ContinuationToken: token,
    }));
    for (const obj of res.Contents || []) keys.push(obj.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function movePrefix(oldPrefix, newPrefix) {
  const keys = await listAllObjects(oldPrefix);
  console.log(`\n${oldPrefix} → ${newPrefix}: ${keys.length}개 파일`);

  for (const oldKey of keys) {
    const newKey = newPrefix + oldKey.slice(oldPrefix.length);
    try {
      await R2.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${oldKey}`,
        Key: newKey,
      }));
      await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey }));
      console.log(`  [OK] ${oldKey} → ${newKey}`);
    } catch (err) {
      console.error(`  [FAIL] ${oldKey}: ${err.message}`);
    }
  }
}

async function updateDbFileNames() {
  console.log("\n=== DB file_name 업데이트 ===");
  // approval_notice_files의 file_name은 파일명만 저장 (폴더 없음)
  // R2 키는 코드에서 `approval/notice/${file_name}`으로 조합하므로 DB 변경 불필요
  console.log("  file_name은 파일명만이므로 변경 불필요");
}

async function updateContentUrls() {
  console.log("\n=== 본문 이미지 URL 치환 ===");
  const { data: posts } = await admin
    .from("approval_notice_posts")
    .select("id, content")
    .not("content", "is", null);

  for (const post of posts || []) {
    if (!post.content) continue;
    const newContent = post.content.replaceAll(
      `${R2_PUBLIC}/approval_notice_editor/`,
      `${R2_PUBLIC}/approval/notice_editor/`
    );
    if (newContent !== post.content) {
      await admin.from("approval_notice_posts").update({ content: newContent }).eq("id", post.id);
      console.log(`  글 #${post.id} URL 치환 완료`);
    }
  }
}

async function main() {
  console.log("=== R2 폴더 이동 시작 ===");

  await movePrefix("approval_notice/", "approval/notice/");
  await movePrefix("approval_notice_editor/", "approval/notice_editor/");
  await updateDbFileNames();
  await updateContentUrls();

  console.log("\n=== 완료 ===");
}

main().catch(console.error);
