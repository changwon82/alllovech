import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Load env
const envFile = fs.readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";
const R2_PREFIX = "brothers";
const WWW = "/Users/ohyeajesus/Downloads/www";

const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };

async function uploadToR2(key, buffer, fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  await s3.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: MIME[ext] || "application/octet-stream",
  }));
}

// Load posts
const posts = JSON.parse(fs.readFileSync("scripts/brothers_data.json", "utf-8"));
console.log(`Migrating ${posts.length} brothers posts...`);

// Track uploaded files to avoid duplicates
const uploadedMap = new Map(); // original path -> R2 URL

async function resolveImage(src) {
  // Already processed
  if (uploadedMap.has(src)) return uploadedMap.get(src);

  let localPath = null;
  let fileName = null;

  // Local relative path: /data/editor/...
  if (src.startsWith("/data/")) {
    localPath = path.join(WWW, src);
    fileName = path.basename(src);
  }
  // alllovechurch.org URLs - try to find locally
  else if (src.includes("alllovechurch.org/data/")) {
    const dataPath = src.replace(/https?:\/\/(www\.)?alllovechurch\.org/, "");
    localPath = path.join(WWW, dataPath);
    fileName = path.basename(dataPath);
  }

  if (!localPath || !fileName) {
    // External image - keep as-is
    uploadedMap.set(src, src);
    return src;
  }

  if (!fs.existsSync(localPath)) {
    console.warn(`  Missing: ${localPath}`);
    uploadedMap.set(src, src); // keep original URL
    return src;
  }

  const buffer = fs.readFileSync(localPath);
  const key = `${R2_PREFIX}/${fileName}`;
  try {
    await uploadToR2(key, buffer, fileName);
    const r2Url = `${R2_PUBLIC}/${key}`;
    uploadedMap.set(src, r2Url);
    return r2Url;
  } catch (e) {
    console.warn(`  Upload failed: ${fileName}`, e.message);
    uploadedMap.set(src, src);
    return src;
  }
}

// Process posts - replace image URLs
let uploadCount = 0;
for (const post of posts) {
  if (!post.content) continue;

  // Find all image src attributes
  const imgRegex = /src=["']([^"']+\.(jpg|jpeg|png|gif|webp|bmp|JPG|JPEG|PNG|GIF))/gi;
  const matches = [...post.content.matchAll(imgRegex)];

  for (const match of matches) {
    const oldSrc = match[1];
    const newSrc = await resolveImage(oldSrc);
    if (newSrc !== oldSrc) {
      post.content = post.content.split(oldSrc).join(newSrc);
      uploadCount++;
    }
  }
}

console.log(`Uploaded ${uploadedMap.size} unique images (${uploadCount} replacements)`);

// Insert into Supabase in batches
const BATCH = 50;
let inserted = 0;
for (let i = 0; i < posts.length; i += BATCH) {
  const batch = posts.slice(i, i + BATCH).map((p) => ({
    title: p.title,
    content: p.content || null,
    post_date: p.post_date,
    hit_count: p.hit_count,
  }));

  const { error } = await supabase.from("brothers_posts").insert(batch);
  if (error) {
    console.error(`Batch ${i} error:`, error.message);
  } else {
    inserted += batch.length;
    process.stdout.write(`\r  Inserted ${inserted}/${posts.length}`);
  }
}

console.log(`\nDone! Inserted ${inserted}/${posts.length} posts`);
