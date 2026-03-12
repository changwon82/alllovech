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
console.log(`유효한 계정이름 ${validAccounts.length}개`);

// 2. account_name이 NULL인 레코드의 본문에서 계정이름 추출
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

console.log(`account_name이 NULL인 레코드: ${nullPosts.length}건\n`);

// 본문에서 계정이름 패턴 추출
// 패턴: "(4) 계정이름..." 또는 "(3) 계정이름..." 뒤의 ":" 이후 값
const patterns = [
  /계정이름[^:]*[:：]\s*(.+)/,
  /계정이름[^:]*[:：]\s*(.+)/,
];

let matched = 0;
let fuzzyMatched = 0;
const updates = [];

for (const p of nullPosts) {
  if (!p.content) continue;

  // HTML 태그 제거
  const text = p.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');

  let extracted = null;
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      extracted = m[1].trim().replace(/\s+/g, '');
      break;
    }
  }

  if (!extracted) continue;

  // 정확히 일치하는 계정이름 찾기
  let bestMatch = validAccounts.find(a => a === extracted);

  // 부분 일치 (사용자 입력이 축약된 경우)
  if (!bestMatch) {
    bestMatch = validAccounts.find(a => a.includes(extracted) || extracted.includes(a));
  }

  // 유사 매칭 (소품비 → 소모품비)
  if (!bestMatch) {
    bestMatch = validAccounts.find(a => {
      // 첫 글자 + 마지막 글자 일치 + 길이 비슷
      if (extracted.length >= 2 && a.length >= 2) {
        if (a[0] === extracted[0] && a[a.length-1] === extracted[extracted.length-1]) {
          return Math.abs(a.length - extracted.length) <= 2;
        }
      }
      return false;
    });
  }

  if (bestMatch) {
    updates.push({ id: p.id, title: p.title, extracted, matched: bestMatch });
    if (extracted === bestMatch) matched++;
    else fuzzyMatched++;
  }
}

console.log(`본문에서 계정이름 추출 결과:`);
console.log(`  정확 일치: ${matched}건`);
console.log(`  유사 일치: ${fuzzyMatched}건`);
console.log(`  총 매칭: ${updates.length}건\n`);

// 샘플 출력
console.log("=== 매칭 샘플 (최근 30건) ===");
for (const u of updates.slice(-30)) {
  const mark = u.extracted === u.matched ? "=" : "~";
  console.log(`[${u.id}] "${u.extracted}" ${mark}> "${u.matched}" | ${u.title}`);
}

// 매칭 안 된 것 중 본문에 계정이름 패턴이 있는 것
console.log("\n=== 매칭 실패 샘플 ===");
let failCount = 0;
for (const p of nullPosts) {
  if (!p.content) continue;
  const text = p.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  const m = text.match(/계정이름[^:]*[:：]\s*(.+)/);
  if (m) {
    const extracted = m[1].trim().replace(/\s+/g, '');
    const alreadyMatched = updates.find(u => u.id === p.id);
    if (!alreadyMatched && failCount < 20) {
      console.log(`[${p.id}] 추출="${extracted}" | ${p.title}`);
      failCount++;
    }
  }
}
