/**
 * 구 사이트 editor 이미지를 R2로 마이그레이션하고 DB content URL을 치환
 *
 * 1. news_posts, gallery_posts, brothers_posts에서 alllovechurch.org 이미지 URL 추출
 * 2. 구 사이트에서 다운로드 → R2 업로드 (editor/서브폴더/파일명 구조 유지)
 * 3. DB content에서 URL 일괄 치환
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import http from "http";

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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

function downloadHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
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

async function getAllPosts(table) {
  const posts = [];
  let offset = 0;
  while (true) {
    const { data } = await sb.from(table).select("id, content").not("content", "is", null).range(offset, offset + 999);
    if (!data || data.length === 0) break;
    posts.push(...data);
    offset += 1000;
    if (data.length < 1000) break;
  }
  return posts;
}

async function main() {
  console.log("=== Editor 이미지 R2 마이그레이션 ===\n");

  const TABLES = ["news_posts", "gallery_posts", "brothers_posts"];

  // 1. 모든 고유 URL 추출
  const urlPattern = /http:\/\/alllovechurch\.org\/data\/editor\/([^\s"'<>]+)/g;
  const allUrls = new Map(); // url -> r2Key

  const tableData = {};
  for (const table of TABLES) {
    const posts = await getAllPosts(table);
    tableData[table] = posts;
    for (const p of posts) {
      let match;
      const regex = new RegExp(urlPattern.source, "g");
      while ((match = regex.exec(p.content)) !== null) {
        const fullUrl = match[0];
        const path = match[1]; // e.g. "2602/filename.jpeg"
        allUrls.set(fullUrl, `editor/${path}`);
      }
    }
  }

  console.log(`고유 이미지 URL: ${allUrls.size}개\n`);

  // 2. R2에 없는 이미지 다운로드 & 업로드
  let uploaded = 0, skipped = 0, failed = 0;
  const entries = [...allUrls.entries()];

  const BATCH = 5;
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async ([oldUrl, r2Key]) => {
        // 이미 R2에 있는지 확인
        if (await existsOnR2(r2Key)) {
          skipped++;
          return "skip";
        }

        // 다운로드
        const body = await downloadHttp(oldUrl);
        const ext = r2Key.substring(r2Key.lastIndexOf(".")).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        // 업로드
        await R2.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: r2Key,
            Body: body,
            ContentType: contentType,
          })
        );
        uploaded++;
        return "ok";
      })
    );

    for (const r of results) {
      if (r.status === "rejected") {
        failed++;
        console.error("  실패:", r.reason?.message);
      }
    }

    if ((i + BATCH) % 50 === 0 || i + BATCH >= entries.length) {
      console.log(`  진행: ${Math.min(i + BATCH, entries.length)}/${entries.length} (업로드: ${uploaded}, 스킵: ${skipped}, 실패: ${failed})`);
    }
  }

  console.log(`\n업로드 완료: ${uploaded}개 업로드, ${skipped}개 스킵, ${failed}개 실패\n`);

  // 3. DB content URL 치환
  console.log("=== DB content URL 치환 ===\n");

  for (const table of TABLES) {
    const posts = tableData[table];
    let updated = 0;

    for (const p of posts) {
      if (!p.content.includes("alllovechurch.org")) continue;

      let newContent = p.content;
      for (const [oldUrl, r2Key] of allUrls) {
        const r2Url = `${R2_PUBLIC}/${r2Key}`;
        newContent = newContent.replaceAll(oldUrl, r2Url);
      }

      if (newContent !== p.content) {
        const { error } = await sb.from(table).update({ content: newContent }).eq("id", p.id);
        if (error) {
          console.error(`  ${table} #${p.id} 업데이트 실패:`, error.message);
        } else {
          updated++;
        }
      }
    }

    console.log(`${table}: ${updated}개 게시글 URL 치환 완료`);
  }

  console.log("\n=== 마이그레이션 완료 ===");
}

main().catch(console.error);
