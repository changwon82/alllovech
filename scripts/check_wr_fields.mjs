import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0"
);

// cafe24 원본 테이블에서 wr_8 ~ wr_15, wr_1 확인
const { data, error } = await admin.rpc("exec_sql", {
  query: `SELECT wr_id, wr_subject, wr_1, wr_8, wr_11, wr_12, wr_13, wr_14, wr_15
          FROM cafe24.qqqq_g5_write_approval1
          WHERE wr_id IN (24248, 24249, 24250, 24251, 24252, 24253, 24254)
          ORDER BY wr_id DESC`
});

if (error) {
  console.log("RPC failed, trying direct SQL via pg...", error.message);

  // cafe24 dump 파일에서 직접 검색
  console.log("\n직접 SQL 실행 불가. cafe24_dump.sql에서 검색합니다...");
} else {
  console.log(JSON.stringify(data, null, 2));
}
