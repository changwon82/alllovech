import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0"
);

// 아직 NULL인 레코드
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

// 분류
let noContent = 0;
let hasAccountPattern = 0;
let noAccountPattern = 0;
const samples = [];

for (const p of nullPosts) {
  if (!p.content) {
    noContent++;
    continue;
  }

  const text = p.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  const m = text.match(/계정이름[^:]*[:：]\s*(.+)/);

  if (m) {
    const extracted = m[1].trim().replace(/\s+/g, '').slice(0, 80);
    hasAccountPattern++;
    if (samples.length < 30) {
      samples.push({ id: p.id, title: p.title, extracted });
    }
  } else {
    noAccountPattern++;
    // 다른 패턴 검색
    const altPatterns = [
      /계정[^:]*[:：]\s*(.+)/,
      /예산\s*계정[^:]*[:：]\s*(.+)/,
      /\(4\)[^:]*[:：]\s*(.+)/,
      /\(3\)[^:]*[:：]\s*(.+)/,
    ];
    let found = false;
    for (const pat of altPatterns) {
      const m2 = text.match(pat);
      if (m2) {
        if (samples.length < 50) {
          samples.push({ id: p.id, title: p.title, extracted: `[대체패턴] ${m2[1].trim().slice(0, 60)}` });
        }
        found = true;
        break;
      }
    }
    if (!found && samples.length < 80) {
      // 본문 첫 200자 확인
      const preview = text.replace(/\r?\n/g, ' ').slice(0, 150);
      samples.push({ id: p.id, title: p.title, extracted: `[패턴없음] ${preview}` });
    }
  }
}

console.log(`본문 없음: ${noContent}건`);
console.log(`계정이름 패턴 있음(이전에 매칭 실패): ${hasAccountPattern}건`);
console.log(`계정이름 패턴 없음: ${noAccountPattern}건`);

console.log(`\n=== 샘플 ===`);
for (const s of samples) {
  console.log(`[${s.id}] ${s.title}`);
  console.log(`  → ${s.extracted}`);
}
