import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
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

const BUCKET = env.R2_BUCKET;
const THUMB_WIDTH = 400;
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp"]);
const BATCH_SIZE = 10;

function isImage(key) {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTS.has(ext);
}

function toThumbKey(key) {
  const parts = key.split("/");
  const fileName = parts.pop();
  return [...parts, "_thumb", fileName].join("/");
}

async function exists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

async function generateThumb(key) {
  const thumbKey = toThumbKey(key);

  // 이미 존재하면 스킵
  if (await exists(thumbKey)) return "skip";

  try {
    // 원본 다운로드
    const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const chunks = [];
    for await (const chunk of res.Body) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    // 썸네일 생성 (400px, WebP)
    const thumbBuffer = await sharp(buffer)
      .resize(THUMB_WIDTH)
      .webp({ quality: 75 })
      .toBuffer();

    // 업로드
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: thumbKey,
      Body: thumbBuffer,
      ContentType: "image/webp",
    }));

    return "ok";
  } catch (e) {
    return "error: " + e.message;
  }
}

// 폴더별 처리
const folders = ["gallery/", "jubo/"];

for (const folder of folders) {
  console.log(`\n=== ${folder} ===`);

  // 모든 파일 목록 가져오기 (_thumb/ 제외)
  const allKeys = [];
  let token;
  do {
    const res = await r2.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: folder,
      MaxKeys: 1000,
      ContinuationToken: token,
    }));
    for (const o of res.Contents || []) {
      if (o.Key && isImage(o.Key) && !o.Key.includes("/_thumb/")) {
        allKeys.push(o.Key);
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  console.log(`이미지 파일: ${allKeys.length}개`);

  let created = 0, skipped = 0, errors = 0;

  for (let i = 0; i < allKeys.length; i += BATCH_SIZE) {
    const batch = allKeys.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(generateThumb));

    for (const r of results) {
      if (r === "ok") created++;
      else if (r === "skip") skipped++;
      else errors++;
    }

    // 진행률 (50개마다)
    if ((i + BATCH_SIZE) % 50 === 0 || i + BATCH_SIZE >= allKeys.length) {
      const done = Math.min(i + BATCH_SIZE, allKeys.length);
      console.log(`  ${done}/${allKeys.length} (생성: ${created}, 스킵: ${skipped}, 오류: ${errors})`);
    }
  }

  console.log(`완료 — 생성: ${created}, 스킵: ${skipped}, 오류: ${errors}`);
}
