import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://9cc4c6c71797558c3e147fce207b8e04.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "41c7900e0c91179112fd9281b6fda19f",
    secretAccessKey: "8081c44eac6e340272cfe06b8e3df418de0ebee8bd5e3f589c33adb468836888",
  },
});

const files = [
  "4bc6532af74f99a72c9850e140427e0f_1771991956_146.jpeg",
  "4bc6532af74f99a72c9850e140427e0f_1771991956_5539.jpeg",
  "4bc6532af74f99a72c9850e140427e0f_1771991956_9902.jpeg",
  "4bc6532af74f99a72c9850e140427e0f_1771991957_3885.jpeg",
];

for (const f of files) {
  for (const prefix of ["news", "gallery"]) {
    try {
      await R2.send(new HeadObjectCommand({ Bucket: "alllovech-images", Key: `${prefix}/${f}` }));
      console.log(`O ${prefix}/${f}`);
    } catch {
      console.log(`X ${prefix}/${f}`);
    }
  }
}
