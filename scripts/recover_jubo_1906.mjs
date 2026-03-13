import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

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

const MIME = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", JPG: "image/jpeg",
};

// 1. editor/1906/ 파일들을 R2 jubo/1906/에 업로드
const dir = "/Users/ohyeajesus/Downloads/www/data/editor/1906";
const files = readdirSync(dir);

console.log(`업로드할 파일: ${files.length}개\n`);

for (const file of files) {
  const key = `jubo/1906/${file}`;
  const ext = file.split(".").pop().toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  const body = readFileSync(join(dir, file));

  await r2.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  console.log(`업로드: ${key} (${body.length} bytes)`);
}

// 2. 해당 게시물의 content 확인 (원본 사이트의 DB에서 가져와야 하는데,
//    content를 수동으로 구성해야 함)

// 타임스탬프로 파일 분류
// 모든 파일이 같은 해시(0af0149c...)이므로 같은 시점에 올린 것
// 6/30 주보와 6/23 주보 - 어떤 파일이 어디에 속하는지 확인 필요

// 일단 모든 파일의 이미지 태그를 생성
const allImgTags = files
  .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
  .map(f => `<p><img src="${R2_PUBLIC}/jubo/1906/${f}"></p>`)
  .join("\n");

console.log("\n생성된 이미지 태그:");
console.log(allImgTags);

// 3. 게시물 content 업데이트
// post id=305 (6월 30일) - 나중에 올린 파일들
// post id=304 (6월 23일) - 먼저 올린 파일들
// 정확한 분류가 어려우니 일단 모두 표시하고 사용자가 확인 후 분리

// 파일 타임스탬프 확인
for (const file of files) {
  const ts = parseInt(file.split("_")[1]);
  console.log(`${file} → ${new Date(ts * 1000).toISOString()}`);
}
