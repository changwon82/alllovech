import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";

const EDITOR_ROOT = "/Users/ohyeajesus/Downloads/www/data/editor";

const listText = await readFile(
  new URL("./jubo-editor-files-in-gallery.txt", import.meta.url),
  "utf-8"
);
const allFiles = new Set(listText.trim().split("\n").filter(Boolean).map(f => f.trim()));

const localFiles = new Set();
const subdirs = await readdir(EDITOR_ROOT);
for (const sub of subdirs) {
  const subPath = join(EDITOR_ROOT, sub);
  const s = await stat(subPath);
  if (!s.isDirectory()) continue;
  const files = await readdir(subPath);
  for (const f of files) {
    if (allFiles.has(f)) localFiles.add(f);
  }
}

const missing = [...allFiles].filter(f => !localFiles.has(f));
console.log(`누락 파일: ${missing.length}개\n`);
console.log("샘플 10개:");
missing.slice(0, 10).forEach(f => console.log(`  ${f}`));
