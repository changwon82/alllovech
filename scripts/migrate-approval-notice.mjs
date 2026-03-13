/**
 * 재정공지 마이그레이션
 * 1. cafe24.qqqq_g5_write_approval_notice → approval_notice_posts
 * 2. cafe24.qqqq_g5_board_file (bo_table=approval_notice) → R2 + approval_notice_files
 * 3. 본문 내 alllovechurch.org 이미지 → R2 업로드 + URL 치환
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import http from "http";
import { extname } from "path";

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
const OLD_HOST = "http://alllovechurch.org";

const SUPABASE_URL = "https://prxsxywpdrelgmluhsyn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const MIME_TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
  ".pdf": "application/pdf", ".hwp": "application/x-hwp",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".zip": "application/zip",
};

function downloadHttp(url) {
  return new Promise((resolve, reject) => {
    const doRequest = (reqUrl) => {
      http.get(reqUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return doRequest(res.headers.location);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${reqUrl}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }).on("error", reject);
    };
    doRequest(url);
  });
}

async function existsOnR2(key) {
  try {
    await R2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(key, body, contentType) {
  await R2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

// ── 1. cafe24에서 글 목록 읽기 ──
async function fetchOldPosts() {
  // cafe24 스키마 접근을 위해 SQL로 직접 조회
  const { data, error } = await admin.from("approval_notice_posts").select("id").limit(1);

  // cafe24 스키마 직접 접근 불가 → REST API로 대체 불가
  // 대신 이미 확인한 데이터를 기반으로 SQL migration 방식 사용
  console.log("cafe24 스키마 직접 접근이 불가하므로 SQL 방식으로 마이그레이션합니다.");
  console.log("아래 SQL을 Supabase Dashboard에서 실행해주세요:\n");

  const sql = `
-- 재정공지 글 마이그레이션 (cafe24 → public)
INSERT INTO approval_notice_posts (id, title, content, author, post_date, hit_count, created_at)
SELECT
  wr_id,
  wr_subject,
  wr_content,
  wr_name,
  wr_datetime,
  wr_hit,
  wr_datetime
FROM cafe24.qqqq_g5_write_approval_notice
WHERE wr_is_comment = 0
ORDER BY wr_id;

-- id 시퀀스를 마지막 id 이후로 설정
SELECT setval(pg_get_serial_sequence('approval_notice_posts', 'id'),
  (SELECT MAX(id) FROM approval_notice_posts));
`;

  console.log(sql);
  return sql;
}

// ── 2. 첨부파일 마이그레이션 ──
async function migrateFiles() {
  // 5개 파일 정보 (이미 확인됨)
  const files = [
    { wr_id: 12, bf_no: 0, bf_source: "다애교회 헌금방법 안내.pptx", bf_file: "239017234_9c83vmAQ_0f71dc4543715d510492048f74aa46b723063c9c.pptx" },
    { wr_id: 17, bf_no: 0, bf_source: "20240603_123602.png", bf_file: "238327584_hjI6zado_461f15c0cf9aa4e542182a46e20f46adf9cfe757.png" },
    { wr_id: 17, bf_no: 1, bf_source: "20240603_123621.png", bf_file: "238327584_5RXfdjy3_8c4f5d0e7f6b59c722dc0454a1b2c2fc95bb265d.png" },
    { wr_id: 21, bf_no: 0, bf_source: "20250904_111617.png", bf_file: "238329863_AJLBmV6r_97d408387095074ba0f73d8042160b2b3f52f791.png" },
    { wr_id: 21, bf_no: 1, bf_source: "20250904_111947.png", bf_file: "238329863_b0MTs23d_a553cad4445f885ad099eaca772dab8dc7fb98e3.png" },
  ];

  console.log("\n=== 첨부파일 R2 업로드 ===\n");

  const fileRecords = [];

  for (const f of files) {
    const url = `${OLD_HOST}/data/file/approval_notice/${f.bf_file}`;
    const r2Key = `approval_notice/${f.bf_file}`;

    // R2에 이미 있는지 확인
    if (await existsOnR2(r2Key)) {
      console.log(`  [SKIP] ${f.bf_source} (이미 존재)`);
    } else {
      try {
        console.log(`  다운로드: ${f.bf_source}...`);
        const body = await downloadHttp(url);
        const ext = extname(f.bf_file).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        await uploadToR2(r2Key, body, contentType);
        console.log(`  [OK] ${f.bf_source} → R2 (${body.length} bytes)`);
      } catch (err) {
        console.error(`  [FAIL] ${f.bf_source}: ${err.message}`);
        continue;
      }
    }

    fileRecords.push({
      post_id: f.wr_id,
      file_name: f.bf_file,
      original_name: f.bf_source,
      sort_order: f.bf_no,
    });
  }

  // DB에 파일 레코드 삽입
  if (fileRecords.length > 0) {
    console.log(`\n  DB에 ${fileRecords.length}개 파일 레코드 삽입...`);
    const { error } = await admin.from("approval_notice_files").insert(fileRecords);
    if (error) {
      console.error("  파일 레코드 삽입 실패:", error.message);
    } else {
      console.log("  [OK] 파일 레코드 삽입 완료");
    }
  }
}

// ── 3. 본문 이미지 마이그레이션 ──
async function migrateContentImages() {
  console.log("\n=== 본문 이미지 URL 치환 ===\n");

  const { data: posts, error } = await admin
    .from("approval_notice_posts")
    .select("id, content")
    .not("content", "is", null);

  if (error) {
    console.error("글 조회 실패:", error.message);
    return;
  }

  // alllovechurch.org 이미지 URL 추출
  const imgRegex = /https?:\/\/(?:www\.)?alllovechurch\.org\/data\/editor\/([^\s"'<>]+)/g;

  for (const post of posts) {
    if (!post.content) continue;

    const matches = [...post.content.matchAll(imgRegex)];
    if (matches.length === 0) continue;

    console.log(`  글 #${post.id}: ${matches.length}개 이미지 발견`);
    let newContent = post.content;

    for (const match of matches) {
      const oldUrl = match[0];
      const editorPath = match[1]; // e.g. "2310/a1d2103a...png"
      const r2Key = `approval_notice_editor/${editorPath}`;

      if (await existsOnR2(r2Key)) {
        console.log(`    [SKIP] ${editorPath} (이미 존재)`);
      } else {
        try {
          const body = await downloadHttp(oldUrl);
          const ext = extname(editorPath).toLowerCase();
          const contentType = MIME_TYPES[ext] || "application/octet-stream";
          await uploadToR2(r2Key, body, contentType);
          console.log(`    [OK] ${editorPath} (${body.length} bytes)`);
        } catch (err) {
          console.error(`    [FAIL] ${editorPath}: ${err.message}`);
          continue;
        }
      }

      const newUrl = `${R2_PUBLIC}/${r2Key}`;
      newContent = newContent.replaceAll(oldUrl, newUrl);
    }

    if (newContent !== post.content) {
      const { error: updateErr } = await admin
        .from("approval_notice_posts")
        .update({ content: newContent })
        .eq("id", post.id);

      if (updateErr) {
        console.error(`    글 #${post.id} 업데이트 실패:`, updateErr.message);
      } else {
        console.log(`    글 #${post.id} URL 치환 완료`);
      }
    }
  }
}

// ── 실행 ──
async function main() {
  console.log("=== 재정공지 마이그레이션 시작 ===\n");

  // Step 1: 글 마이그레이션 SQL 출력
  await fetchOldPosts();

  console.log("\n위 SQL을 실행한 후, 이 스크립트를 --files 옵션으로 다시 실행하세요.");
  console.log("  node scripts/migrate-approval-notice.mjs --files\n");

  if (process.argv.includes("--files")) {
    // Step 2: 첨부파일 마이그레이션
    await migrateFiles();

    // Step 3: 본문 이미지 마이그레이션
    await migrateContentImages();

    console.log("\n=== 마이그레이션 완료 ===");
  }
}

main().catch(console.error);
