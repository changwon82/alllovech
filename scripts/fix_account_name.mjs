import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0"
);

// 1. 유효한 계정이름 목록
const { data: budgets } = await admin
  .from("approval_budgets")
  .select("account");
const validAccounts = [...new Set((budgets || []).map(b => b.account.trim()))];

// 2. account_name이 NULL인 레코드
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

// 3. 본문에서 계정이름 추출 + 매칭
const updates = [];

for (const p of nullPosts) {
  if (!p.content) continue;
  const text = p.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  const m = text.match(/계정이름[^:]*[:：]\s*(.+)/);
  if (!m) continue;

  const extracted = m[1].trim().replace(/\s+/g, '');

  // 정확 일치
  let bestMatch = validAccounts.find(a => a === extracted);

  // 부분 일치 (축약형)
  if (!bestMatch) {
    bestMatch = validAccounts.find(a => a.includes(extracted) || extracted.includes(a));
  }

  // 유사 매칭 (첫글자+끝글자+길이)
  if (!bestMatch) {
    bestMatch = validAccounts.find(a => {
      if (extracted.length >= 2 && a.length >= 2) {
        if (a[0] === extracted[0] && a[a.length-1] === extracted[extracted.length-1]) {
          return Math.abs(a.length - extracted.length) <= 2;
        }
      }
      return false;
    });
  }

  if (bestMatch) {
    updates.push({ id: p.id, account_name: bestMatch });
  }
}

console.log(`${updates.length}건 업데이트 시작...`);

// 4. 배치 업데이트
let updated = 0;
for (const u of updates) {
  const { error } = await admin
    .from("approval_posts")
    .update({ account_name: u.account_name })
    .eq("id", u.id);
  if (error) {
    console.log(`[${u.id}] 실패: ${error.message}`);
  } else {
    updated++;
  }
}

console.log(`완료: ${updated}건 업데이트됨`);

// 5. 최종 통계
const { count: nullCount } = await admin
  .from("approval_posts")
  .select("id", { count: "exact", head: true })
  .is("account_name", null);

const { count: hasCount } = await admin
  .from("approval_posts")
  .select("id", { count: "exact", head: true })
  .not("account_name", "is", null);

console.log(`\n최종: account_name 있음 ${hasCount}건, NULL ${nullCount}건`);
