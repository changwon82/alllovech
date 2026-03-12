import { readFileSync } from "fs";

const dump = readFileSync("/Users/ohyeajesus/Downloads/alllovechurch-20260308.dump", "utf-8");

// g5_write_approval1 INSERT 문 찾기
const startIdx = dump.indexOf("INSERT INTO `g5_write_approval1` VALUES ");
if (startIdx === -1) { console.log("못 찾음"); process.exit(1); }

const endIdx = dump.indexOf(";\n", startIdx);
const insertStr = dump.slice(startIdx, endIdx);

// MySQL VALUES 파싱 - 따옴표를 고려하여 행 분리
function parseRows(str) {
  const rows = [];
  let i = str.indexOf("(");

  while (i < str.length && i !== -1) {
    // 각 행의 시작 '(' 찾기
    if (str[i] !== '(') { i++; continue; }

    i++; // skip (
    const fields = [];
    let field = "";
    let inQuote = false;

    while (i < str.length) {
      const ch = str[i];

      if (inQuote) {
        if (ch === '\\') {
          field += str[i + 1];
          i += 2;
          continue;
        }
        if (ch === "'") {
          inQuote = false;
          i++;
          continue;
        }
        field += ch;
        i++;
      } else {
        if (ch === "'") {
          inQuote = true;
          i++;
          continue;
        }
        if (ch === ',') {
          fields.push(field);
          field = "";
          i++;
          continue;
        }
        if (ch === ')') {
          fields.push(field);
          rows.push(fields);
          i++;
          break;
        }
        field += ch;
        i++;
      }
    }
  }
  return rows;
}

const rows = parseRows(insertStr);
console.log(`총 ${rows.length}행 파싱됨`);

// 컬럼 인덱스: 0:wr_id, 4:wr_is_comment, 7:ca_name, 9:wr_subject, 37:wr_8, 40:wr_11, 41:wr_12, 43:wr_14
const targetIds = new Set([24254,24253,24252,24251,24250,24249,24248,24247,24246,24245,24244,24243,24242,24241,24240]);

console.log("\nID    | ca_name         | wr_8         | wr_14        | wr_11 (처음50자)");
console.log("------|-----------------|--------------|--------------|----");

const wr8Counts = {};

for (const f of rows) {
  const wrId = parseInt(f[0]);
  const isComment = parseInt(f[4]);
  if (isComment !== 0) continue;

  const wr8 = f[37] || "";
  if (wr8) wr8Counts[wr8] = (wr8Counts[wr8] || 0) + 1;

  if (targetIds.has(wrId)) {
    const wr11short = (f[40] || "").slice(0, 50);
    console.log(`${wrId} | ${(f[7] || "").padEnd(15)} | ${(wr8 || "-").padEnd(12)} | ${(f[43] || "-").padEnd(12)} | ${wr11short}`);
  }
}

console.log(`\n=== wr_8 값 분포 (상위 20) ===`);
const sorted8 = Object.entries(wr8Counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [v, c] of sorted8) console.log(`  "${v}": ${c}`);
if (sorted8.length === 0) console.log("  (모두 비어있음)");
