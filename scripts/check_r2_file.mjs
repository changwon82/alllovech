import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

// .env.local 파싱
const envFile = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const file = "4bc6532af74f99a72c9850e140427e0f_1771636398_1753.jpeg";

async function check(key) {
  try {
    const res = await client.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
    console.log("EXISTS:", key, `(${res.ContentLength} bytes)`);
  } catch (e) {
    console.log("NOT FOUND:", key);
  }
}

await check("jubo/" + file);
await check("jubo/2602/" + file);
await check("lost_folder/jubo/" + file);
await check("lost_folder/jubo/2602/" + file);

// DB에서 이 파일 참조 확인
import { createClient } from "@supabase/supabase-js";
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 1. jubo_images에서 확인
const { data: imgs } = await admin.from("jubo_images").select("*").eq("file_name", file);
console.log("\njubo_images 결과:", imgs?.length ? imgs : "없음");

// 2. jubo_posts content에서 확인
const { data: posts } = await admin.from("jubo_posts").select("id, title, content").like("content", `%${file}%`);
console.log("jubo_posts content 결과:", posts?.length ? posts.map(p => ({ id: p.id, title: p.title })) : "없음");

// 3. content에서 src 태그 확인
if (posts?.length) {
  const content = posts[0].content;
  // 파일명 주변 50자 추출
  const idx = content.indexOf(file);
  if (idx >= 0) {
    console.log("\ncontent에서 파일 참조 부분:");
    console.log(content.substring(Math.max(0, idx - 80), idx + file.length + 20));
  }
}
