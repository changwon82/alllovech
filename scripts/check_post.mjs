import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  "https://prxsxywpdrelgmluhsyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0"
);

const { data } = await admin
  .from("approval_posts")
  .select("id, title, account_name, doc_category")
  .eq("id", 24253)
  .single();

console.log("Post 24253:", JSON.stringify(data, null, 2));

// 예산에서 소모품 관련 항목 확인
const { data: budgets } = await admin
  .from("approval_budgets")
  .select("id, committee, account, purpose")
  .ilike("account", "%소모%")
  .order("account");

console.log("\n소모품 관련 예산:", JSON.stringify(budgets, null, 2));
