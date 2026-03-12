import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Create table via SQL
const { error: sqlErr } = await admin.rpc("exec_sql", {
  query: fs.readFileSync("supabase/migrations/040_brothers.sql", "utf-8"),
});

// Table might need to be created via dashboard if rpc doesn't exist
// Try direct insert approach - check if table exists first
const { data: check, error: checkErr } = await admin
  .from("brothers_posts")
  .select("id")
  .limit(1);

if (checkErr && checkErr.message.includes("does not exist")) {
  console.error("Table brothers_posts does not exist. Please run the SQL migration manually:");
  console.log(fs.readFileSync("supabase/migrations/040_brothers.sql", "utf-8"));
  process.exit(1);
}

console.log("Table brothers_posts exists. Migrating data...");

// 2. Load parsed data
const posts = JSON.parse(fs.readFileSync("scripts/brothers_data.json", "utf-8"));
console.log(`Found ${posts.length} posts to migrate`);

// 3. Insert in batches
const BATCH = 50;
let inserted = 0;
for (let i = 0; i < posts.length; i += BATCH) {
  const batch = posts.slice(i, i + BATCH).map((p) => ({
    title: p.title,
    content: p.content,
    post_date: p.post_date,
    hit_count: p.hit_count,
  }));

  const { error } = await admin.from("brothers_posts").insert(batch);
  if (error) {
    console.error(`Batch ${i} error:`, error.message);
  } else {
    inserted += batch.length;
  }
}

console.log(`Inserted ${inserted}/${posts.length} posts`);
