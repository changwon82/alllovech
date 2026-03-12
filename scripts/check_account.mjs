import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0"
);

// cafe24 원본에서 24251, 24253 확인 (wr_8 등 다른 필드)
const ids = [24248, 24249, 24250, 24251, 24252, 24253, 24254];
const { data } = await admin
  .from("cafe24.qqqq_g5_write_approval1")
  .select("wr_id, wr_subject, wr_8, wr_10, wr_11, wr_12, wr_13, wr_14, wr_15")
  .in("wr_id", ids);

if (data) {
  for (const row of data) {
    console.log(`[${row.wr_id}] ${row.wr_subject}`);
    console.log(`  wr_8=${row.wr_8}, wr_10=${row.wr_10}, wr_11=${row.wr_11}, wr_12=${row.wr_12}, wr_13=${row.wr_13}, wr_14=${row.wr_14}, wr_15=${row.wr_15}`);
  }
} else {
  // cafe24 스키마에 직접 접근 불가 시, approval_posts에서 확인
  console.log("cafe24 직접 조회 불가, approval_posts에서 확인:");
  const { data: posts } = await admin
    .from("approval_posts")
    .select("id, title, account_name, doc_category")
    .in("id", ids)
    .order("id", { ascending: false });
  console.log(JSON.stringify(posts, null, 2));
}

// account_name 컬럼이 어디서 추가되었는지 - 현재 값 샘플
console.log("\n=== account_name 값 분포 (상위 20) ===");
const { data: samples } = await admin
  .from("approval_posts")
  .select("account_name")
  .not("account_name", "is", null)
  .limit(1000);

const counts = {};
for (const s of samples || []) {
  counts[s.account_name] = (counts[s.account_name] || 0) + 1;
}
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [name, count] of sorted) {
  console.log(`  ${name}: ${count}`);
}
