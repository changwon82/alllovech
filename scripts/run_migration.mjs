import { readFileSync } from "fs";

const SUPABASE_URL = "https://prxsxywpdrelgmluhsyn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHN4eXdwZHJlbGdtbHVoc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTg1NSwiZXhwIjoyMDg1OTYxODU1fQ.YvfAzoxLoXK4UvIimOH0E3WmwNra-cmpEhVEl5dJiL0";

const sql = readFileSync("/Users/ohyeajesus/Documents/alllovech/supabase/migrations/035_approval_members.sql", "utf-8");

// Use Supabase's pg REST endpoint for raw SQL
const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ query: sql }),
});

// Try the postgres connection via pg
// Alternative: use the SQL editor API
// Let's try with the /pg endpoint
const pgRes = await fetch(`${SUPABASE_URL}/pg`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ query: sql }),
});

console.log("pg status:", pgRes.status);
if (pgRes.ok) {
  const data = await pgRes.json();
  console.log("Success:", data);
} else {
  const text = await pgRes.text();
  console.log("pg response:", text.substring(0, 500));
  console.log("\nPlease run the SQL manually in Supabase Dashboard:");
  console.log("https://supabase.com/dashboard/project/prxsxywpdrelgmluhsyn/sql/new");
}
