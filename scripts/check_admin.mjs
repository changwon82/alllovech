import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0"
);

// ADMIN 목록
const { data: roles } = await admin.from("user_roles").select("user_id").eq("role", "ADMIN");
if (!roles || roles.length === 0) {
  console.log("ADMIN 없음");
  process.exit(0);
}
const ids = roles.map(r => r.user_id);
const { data: profiles } = await admin.from("profiles").select("id, name, status").in("id", ids);

console.log("=== ADMIN 목록 ===");
for (const p of profiles || []) {
  console.log(`${p.name} (${p.status}) - ${p.id}`);
}

// approval_members user_id 매핑 상태
console.log("\n=== approval_members 매핑 상태 ===");
const { data: members } = await admin.from("approval_members").select("mb_id, name, user_id, status").order("sort_order");
let mapped = 0;
let unmapped = 0;
for (const m of members || []) {
  if (m.user_id) {
    mapped++;
  } else {
    unmapped++;
    console.log(`미매핑: ${m.name} (${m.status}) - mb_id: ${m.mb_id}`);
  }
}
console.log(`\n매핑완료: ${mapped}명, 미매핑: ${unmapped}명`);
