import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

// .env.local 수동 파싱
const envContent = readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
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

const buffer = readFileSync("/tmp/pastor.png");

await client.send(
  new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: "site/pastor.png",
    Body: buffer,
    ContentType: "image/png",
  }),
);

console.log("Uploaded to: https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/site/pastor.png");
