import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

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

const files = [
  { local: "/tmp/church_images/02.jpg", key: "site/about/letter.jpg" },
  { local: "/tmp/church_images/03.jpg", key: "site/about/building.jpg" },
  { local: "/tmp/church_images/04.jpg", key: "site/about/parent-teacher.jpg" },
  { local: "/tmp/church_images/05.jpg", key: "site/about/multicultural.jpg" },
  { local: "/tmp/church_images/06.jpg", key: "site/about/sumba.jpg" },
  { local: "/tmp/church_images/07.jpg", key: "site/about/ezemiah.jpg" },
];

for (const f of files) {
  const buffer = readFileSync(f.local);
  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: f.key,
      Body: buffer,
      ContentType: "image/jpeg",
    }),
  );
  console.log(`Uploaded: https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/${f.key}`);
}
