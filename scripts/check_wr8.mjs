import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0"
);

// 예산 테이블의 유효한 계정이름 목록
const { data: budgets } = await admin
  .from("approval_budgets")
  .select("account")
  .not("account", "is", null);

const validAccounts = new Set((budgets || []).map(b => b.account.trim()));
console.log(`유효한 계정이름: ${validAccounts.size}개`);

// 전체 account_name 검증
let all = [];
let from = 0;
while (true) {
  const { data } = await admin
    .from("approval_posts")
    .select("id, title, account_name")
    .not("account_name", "is", null)
    .range(from, from + 999);
  all = all.concat(data || []);
  if (!data || data.length < 1000) break;
  from += 1000;
}

console.log(`account_name이 있는 레코드: ${all.length}개`);

let valid = 0, invalid = 0;
const invalidValues = {};
for (const p of all) {
  if (validAccounts.has(p.account_name.trim())) {
    valid++;
  } else {
    invalid++;
    invalidValues[p.account_name] = (invalidValues[p.account_name] || 0) + 1;
  }
}

console.log(`\n유효(예산 계정 일치): ${valid}건`);
console.log(`무효(예산 계정 없음): ${invalid}건`);

if (invalid > 0) {
  console.log("\n무효한 값:");
  for (const [v, c] of Object.entries(invalidValues).sort((a,b) => b[1]-a[1])) {
    console.log(`  "${v}": ${c}건`);
  }
}

// NULL인 레코드 수
const { count } = await admin
  .from("approval_posts")
  .select("id", { count: "exact", head: true })
  .is("account_name", null);
console.log(`\naccount_name이 NULL: ${count}건`);
console.log(`총: ${all.length + count}건`);
