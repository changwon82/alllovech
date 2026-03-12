import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0"
);

const ids = [23532,23575,23585,23690,23703,23794,23795,24222,24243,23355,23373,23468,23870,24113,24112,24242,24241,23544];

const { error, count } = await admin
  .from("approval_posts")
  .update({ account_name: "기기 및 비품 구입" })
  .in("id", ids);

if (error) {
  console.log("실패:", error.message);
} else {
  console.log(`${ids.length}건 업데이트 완료`);
}

// 최종 통계
const { count: hasCount } = await admin
  .from("approval_posts")
  .select("id", { count: "exact", head: true })
  .not("account_name", "is", null);

const { count: nullCount } = await admin
  .from("approval_posts")
  .select("id", { count: "exact", head: true })
  .is("account_name", null);

console.log(`최종: 계정이름 있음 ${hasCount}건, NULL ${nullCount}건 (총 ${hasCount + nullCount}건)`);
