import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://9cc4c6c71797558c3e147fce207b8e04.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "41c7900e0c91179112fd9281b6fda19f",
    secretAccessKey: "8081c44eac6e340272cfe06b8e3df418de0ebee8bd5e3f589c33adb468836888",
  },
});

const BUCKET = "alllovech-images";
const FOLDERS = ["board/", "file/"];

async function deleteFolder(prefix) {
  let deleted = 0;
  let continuationToken;

  while (true) {
    const list = await R2.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: 1000,
      ContinuationToken: continuationToken,
    }));

    const objects = list.Contents || [];
    if (objects.length === 0) break;

    const result = await R2.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: objects.map(o => ({ Key: o.Key })),
        Quiet: true,
      },
    }));

    deleted += objects.length;
    console.log(`  [${prefix}] ${deleted}개 삭제...`);

    if (!list.IsTruncated) break;
    continuationToken = list.NextContinuationToken;
  }

  console.log(`  [${prefix}] 완료: ${deleted}개 삭제\n`);
}

async function main() {
  console.log("=== R2 폴더 삭제: board/, file/ ===\n");
  for (const folder of FOLDERS) {
    await deleteFolder(folder);
  }
  console.log("=== 전체 완료 ===");
}

main().catch(console.error);
