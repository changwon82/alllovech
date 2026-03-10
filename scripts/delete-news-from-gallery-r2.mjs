import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://9cc4c6c71797558c3e147fce207b8e04.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "41c7900e0c91179112fd9281b6fda19f",
    secretAccessKey: "8081c44eac6e340272cfe06b8e3df418de0ebee8bd5e3f589c33adb468836888",
  },
});

const BUCKET = "alllovech-images";

// 원래 97개 목록 + 누락 1개
const listText = await readFile(
  new URL("./news-editor-files.txt", import.meta.url),
  "utf-8"
);
const files = [...new Set(listText.trim().split("\n").filter(Boolean).map(f => f.trim()))];
// 누락됐던 파일 추가
files.push("4bc6532af74f99a72c9850e140427e0f_1771991957_3885.jpeg");

console.log(`=== gallery/에서 뉴스 관련 ${files.length}개 삭제 ===\n`);

const result = await R2.send(new DeleteObjectsCommand({
  Bucket: BUCKET,
  Delete: {
    Objects: files.map(f => ({ Key: `gallery/${f}` })),
    Quiet: false,
  },
}));

const deleted = (result.Deleted || []).length;
const errors = (result.Errors || []).length;

console.log(`완료: ${deleted}개 삭제, ${errors}개 실패`);
