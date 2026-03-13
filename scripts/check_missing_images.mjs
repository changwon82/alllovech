import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const r2 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";

async function exists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

// 전체 게시물 조회 (jubo, gallery, news, brothers)
const tables = [
  { name: "jubo", table: "jubo_posts" },
  { name: "gallery", table: "gallery_posts" },
  { name: "news", table: "news_posts" },
  { name: "brothers", table: "brothers_posts" },
];

for (const { name, table } of tables) {
  console.log(`\n=== ${name} ===`);

  // 페이지네이션으로 전체 조회
  const all = [];
  let from = 0;
  while (true) {
    const { data } = await admin
      .from(table)
      .select("id, title, content")
      .order("id")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  // content에서 R2 이미지 URL 추출
  const missing = [];
  let checked = 0;

  for (const post of all) {
    if (!post.content) continue;

    const regex = /src=["']+([^"']+)["']+/g;
    let match;
    while ((match = regex.exec(post.content)) !== null) {
      const url = match[1];
      if (!url.startsWith(R2_PUBLIC)) continue;
      const key = url.slice(R2_PUBLIC.length + 1);
      if (!key) continue;

      checked++;
      const ok = await exists(key);
      if (!ok) {
        missing.push({ postId: post.id, title: post.title, key });
      }
    }
  }

  console.log(`게시물: ${all.length}개, 검사한 이미지: ${checked}개, 누락: ${missing.length}개`);

  for (const m of missing) {
    console.log(`  id=${m.postId} "${m.title}" → ${m.key}`);
  }
}
