import { readFileSync, writeFileSync } from "fs";

const dump = readFileSync("/Users/ohyeajesus/Downloads/alllovechurch-20260308.dump", "utf-8");

// g5_member INSERT 문 찾기
const lines = dump.split("\n").filter(l => l.startsWith("INSERT INTO `g5_member`"));

const members = [];

for (const line of lines) {
  // VALUES (...),(...) 파싱
  const valuesStart = line.indexOf("VALUES ");
  if (valuesStart === -1) continue;
  const valuesStr = line.slice(valuesStart + 7);

  // 각 레코드를 파싱 (쉼표로 구분된 괄호 그룹)
  let depth = 0;
  let current = "";
  const records = [];

  for (let i = 0; i < valuesStr.length; i++) {
    const c = valuesStr[i];
    if (c === "(") {
      depth++;
      if (depth === 1) { current = ""; continue; }
    }
    if (c === ")") {
      depth--;
      if (depth === 0) { records.push(current); continue; }
    }
    if (depth > 0) current += c;
  }

  for (const rec of records) {
    // CSV-like 파싱 (쉼표 구분, 따옴표 처리)
    const fields = [];
    let field = "";
    let inQuote = false;
    let escaped = false;

    for (let i = 0; i < rec.length; i++) {
      const c = rec[i];
      if (escaped) { field += c; escaped = false; continue; }
      if (c === "\\") { escaped = true; field += c; continue; }
      if (c === "'") { inQuote = !inQuote; continue; }
      if (c === "," && !inQuote) { fields.push(field); field = ""; continue; }
      field += c;
    }
    fields.push(field);

    // mb_no(0), mb_id(1), mb_password(2), mb_password2(3), mb_name(4), mb_nick(5),
    // mb_nick_date(6), mb_email(7), mb_homepage(8), mb_level(9), mb_sex(10), mb_birth(11),
    // mb_tel(12), mb_hp(13)
    if (fields.length < 14) continue;

    const mb_id = fields[1].trim();
    const mb_name = fields[4].trim();
    const mb_email = fields[7].trim();
    const mb_hp = fields[13].trim();
    const mb_tel = fields[12].trim();

    if (!mb_id || mb_id === "NULL") continue;

    members.push({ mb_id, mb_name, mb_email, mb_hp, mb_tel });
  }
}

console.log(`회원 ${members.length}명 파싱 완료`);

// 샘플 출력
members.slice(0, 10).forEach(m => console.log(`  ${m.mb_id} | ${m.mb_name} | ${m.mb_email} | ${m.mb_hp}`));

// SQL 생성
let sql = `-- cafe24 회원 참조 테이블
CREATE TABLE IF NOT EXISTS cafe24_members (
  mb_id text PRIMARY KEY,
  name text,
  email text,
  phone text,
  tel text
);

INSERT INTO cafe24_members (mb_id, name, email, phone, tel) VALUES\n`;

const values = members.map(m => {
  const esc = (s) => s.replace(/'/g, "''");
  return `('${esc(m.mb_id)}', '${esc(m.mb_name)}', '${esc(m.mb_email)}', '${esc(m.mb_hp)}', '${esc(m.mb_tel)}')`;
});

sql += values.join(",\n") + "\nON CONFLICT (mb_id) DO NOTHING;\n";

writeFileSync("/Users/ohyeajesus/Documents/alllovech/supabase/migrations/034_cafe24_members.sql", sql);
console.log(`\nSQL 저장: supabase/migrations/034_cafe24_members.sql`);
