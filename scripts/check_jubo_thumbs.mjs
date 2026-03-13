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

// 2019년 주보 게시물 조회
const { data: posts } = await admin
  .from("jubo_posts")
  .select("id, title, post_date, content, jubo_images(file_name, sort_order)")
  .gte("post_date", "2019-05-01")
  .lte("post_date", "2019-08-01")
  .order("post_date", { ascending: false });

const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";

async function exists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

for (const post of posts || []) {
  const images = post.jubo_images || [];
  const imgFile = images.find(img => /\.(jpg|jpeg|png|gif|webp)$/i.test(img.file_name));

  // content에서 첫 이미지 URL 추출
  let contentImg = null;
  if (post.content) {
    const match = post.content.match(/src=["']+([^"']+\.(?:jpg|jpeg|png|gif|webp))["']+/i);
    if (match) contentImg = match[1];
  }

  let status = "?";
  if (imgFile) {
    const key = `jubo/${imgFile.file_name}`;
    const ok = await exists(key);
    status = ok ? "OK (attach)" : `MISSING attach: ${key}`;
  } else if (contentImg) {
    const key = contentImg.startsWith(R2_PUBLIC)
      ? contentImg.slice(R2_PUBLIC.length + 1)
      : contentImg;
    const ok = await exists(key);
    status = ok ? "OK (content)" : `MISSING content: ${key}`;
  } else {
    status = "NO IMAGE";
  }

  console.log(`${post.title} | ${status}`);
}
