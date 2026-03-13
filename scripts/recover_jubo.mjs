import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
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

// jubo/ 하위폴더 목록 확인
const result = await r2.send(new ListObjectsV2Command({
  Bucket: env.R2_BUCKET,
  Prefix: "jubo/",
  Delimiter: "/",
}));

const folders = (result.CommonPrefixes || []).map(p => p.Prefix);
console.log("jubo/ 하위폴더:", folders.length, "개");
console.log(folders.join("\n"));

// lost_folder/jubo/ 하위폴더도 확인
const result2 = await r2.send(new ListObjectsV2Command({
  Bucket: env.R2_BUCKET,
  Prefix: "lost_folder/jubo/",
  Delimiter: "/",
}));

const folders2 = (result2.CommonPrefixes || []).map(p => p.Prefix);
console.log("\nlost_folder/jubo/ 하위폴더:", folders2.length, "개");
console.log(folders2.join("\n"));
