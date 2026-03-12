import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0"
);

const { data: budgets } = await admin.from("approval_budgets").select("account");
const validAccounts = [...new Set((budgets || []).map(b => b.account.trim()))];
// 공백 제거한 버전도 매핑
const noSpaceMap = {};
for (const a of validAccounts) {
  noSpaceMap[a.replace(/\s+/g, '')] = a;
}

let nullPosts = [];
let from = 0;
while (true) {
  const { data } = await admin
    .from("approval_posts")
    .select("id, title, content")
    .is("account_name", null)
    .range(from, from + 999);
  nullPosts = nullPosts.concat(data || []);
  if (!data || data.length < 1000) break;
  from += 1000;
}

const recoverable = [];

for (const p of nullPosts) {
  if (!p.content) continue;
  const text = p.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  const m = text.match(/계정이름[^:]*[:：]\s*(.+)/);
  if (!m) continue;

  let raw = m[1].trim().split(/[\r\n]/)[0].trim();
  // (5), (4) 이후 자르기
  raw = raw.split(/\(\d\)/)[0].trim();

  // 1. 정확 일치
  let match = validAccounts.find(a => a === raw);

  // 2. 공백 무시 일치
  if (!match) {
    const noSpace = raw.replace(/\s+/g, '');
    match = noSpaceMap[noSpace];
  }

  // 3. 유효 계정이 raw 텍스트에 포함되어 있는지 (공백 무시)
  if (!match) {
    const noSpace = raw.replace(/\s+/g, '');
    for (const a of validAccounts) {
      if (noSpace.startsWith(a.replace(/\s+/g, ''))) {
        match = a;
        break;
      }
    }
  }

  if (match) {
    recoverable.push({ id: p.id, title: p.title, raw, matched: match });
  }
}

console.log(`67건 중 복구 가능: ${recoverable.length}건\n`);
for (const r of recoverable) {
  console.log(`[${r.id}] "${r.raw}" → "${r.matched}" | ${r.title}`);
}
