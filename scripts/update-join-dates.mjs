import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://prxsxywpdrelgmluhsyn.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const dump = readFileSync("/Users/ohyeajesus/Downloads/alllovechurch-20260308.dump", "utf-8");
const lines = dump.split("\n").filter((l) => l.startsWith("INSERT INTO `g5_member`"));

const members = [];

for (const line of lines) {
  const valuesStart = line.indexOf("VALUES ");
  if (valuesStart === -1) continue;
  const valuesStr = line.slice(valuesStart + 7);

  let depth = 0;
  let current = "";
  const records = [];

  for (let i = 0; i < valuesStr.length; i++) {
    const c = valuesStr[i];
    if (c === "(") { depth++; if (depth === 1) { current = ""; continue; } }
    if (c === ")") { depth--; if (depth === 0) { records.push(current); continue; } }
    if (depth > 0) current += c;
  }

  for (const rec of records) {
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

    // mb_id(1), mb_email(7), mb_today_login(26), mb_datetime(28)
    if (fields.length < 29) continue;
    const mb_id = fields[1].trim();
    const email = fields[7].trim();
    const mb_datetime = fields[28].trim();
    const mb_today_login = fields[26].trim();

    if (!mb_id || mb_id === "NULL" || !email || !email.includes("@")) continue;

    // 가입일 우선, 없으면 최종접속일
    const datetime = (mb_datetime && mb_datetime !== "0000-00-00 00:00:00")
      ? mb_datetime
      : (mb_today_login && mb_today_login !== "0000-00-00 00:00:00")
        ? mb_today_login
        : null;

    if (!datetime) continue;

    members.push({ mb_id, email: email.toLowerCase(), datetime });
  }
}

console.log(`가입일이 있는 회원: ${members.length}명`);

// auth users 전체 가져오기
let allUsers = [];
let page = 1;
while (true) {
  const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  allUsers = [...allUsers, ...data.users];
  if (data.users.length < 1000) break;
  page++;
}
console.log(`auth users: ${allUsers.length}명`);

// 이메일 → auth user 매핑
const emailToUser = new Map(allUsers.map((u) => [u.email?.toLowerCase(), u]));

let updated = 0;
let skipped = 0;

for (const m of members) {
  const authUser = emailToUser.get(m.email);
  if (!authUser) { skipped++; continue; }

  // profiles.created_at 업데이트
  const { error } = await admin
    .from("profiles")
    .update({ created_at: m.datetime })
    .eq("id", authUser.id);

  if (error) {
    console.error(`  실패 [${m.mb_id}]:`, error.message);
  } else {
    updated++;
  }

  if (updated % 100 === 0 && updated > 0) console.log(`  진행: ${updated}명 업데이트`);
}

console.log(`\n=== 완료 ===`);
console.log(`업데이트: ${updated}명`);
console.log(`매칭 안됨: ${skipped}명`);
