import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readdir, stat } from "fs/promises";
import { join, extname } from "path";

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://9cc4c6c71797558c3e147fce207b8e04.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "41c7900e0c91179112fd9281b6fda19f",
    secretAccessKey: "8081c44eac6e340272cfe06b8e3df418de0ebee8bd5e3f589c33adb468836888",
  },
});

const BUCKET = "alllovech-images";
const R2_PREFIXES = ["gallery", "jubo", "news"];

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".pdf", ".hwp", ".zip"]);

// 로컬 디렉토리 목록 (FTP 다운로드)
const LOCAL_DIRS = [
  { path: "/Users/ohyeajesus/Downloads/www/data/file/gallery", label: "file/gallery" },
  { path: "/Users/ohyeajesus/Downloads/www/data/file/jubo", label: "file/jubo" },
  { path: "/Users/ohyeajesus/Downloads/www/data/file/news", label: "file/news" },
  { path: "/Users/ohyeajesus/Downloads/www/data/user/saveDir/board/www123", label: "board/www123" },
  { path: "/Users/ohyeajesus/Downloads/www/data/user/saveDir/board/www126", label: "board/www126" },
];

// editor 하위 폴더도 추가
const editorRoot = "/Users/ohyeajesus/Downloads/www/data/editor";
try {
  const editorSubs = await readdir(editorRoot);
  for (const sub of editorSubs) {
    const subPath = join(editorRoot, sub);
    const s = await stat(subPath);
    if (s.isDirectory()) {
      LOCAL_DIRS.push({ path: subPath, label: `editor/${sub}` });
    }
  }
} catch {}

async function checkR2(fileName) {
  for (const prefix of R2_PREFIXES) {
    try {
      await R2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: `${prefix}/${fileName}` }));
      return prefix;
    } catch {}
  }
  return null;
}

async function main() {
  console.log("=== 로컬 vs R2 비교 ===\n");

  let totalLocal = 0, totalInR2 = 0, totalMissing = 0;
  const missingFiles = [];

  for (const { path: dirPath, label } of LOCAL_DIRS) {
    let files;
    try { files = await readdir(dirPath); } catch { continue; }

    const mediaFiles = files.filter(f => {
      const ext = extname(f).toLowerCase();
      return IMAGE_EXTS.has(ext);
    });

    if (mediaFiles.length === 0) continue;

    let inR2 = 0, notInR2 = 0;
    const BATCH = 20;

    for (let i = 0; i < mediaFiles.length; i += BATCH) {
      const batch = mediaFiles.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async (f) => {
          const found = await checkR2(f);
          return { file: f, found };
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") {
          if (r.value.found) inR2++;
          else { notInR2++; missingFiles.push({ dir: label, file: r.value.file }); }
        }
      }
    }

    totalLocal += mediaFiles.length;
    totalInR2 += inR2;
    totalMissing += notInR2;

    if (notInR2 > 0) {
      console.log(`[${label}] ${mediaFiles.length}개 중 ${inR2} R2에 있음, ${notInR2} 없음`);
    }
  }

  console.log(`\n=== 요약 ===`);
  console.log(`로컬 전체: ${totalLocal}개`);
  console.log(`R2에 있음: ${totalInR2}개`);
  console.log(`R2에 없음: ${totalMissing}개`);

  if (missingFiles.length > 0) {
    console.log(`\n=== R2에 없는 파일 ===`);
    for (const { dir, file } of missingFiles) {
      console.log(`  ${dir}/${file}`);
    }
  } else {
    console.log("\n모든 로컬 파일이 R2에 있습니다!");
  }
}

main().catch(console.error);
