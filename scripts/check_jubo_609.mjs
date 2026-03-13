import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data } = await admin
  .from("jubo_posts")
  .select("id, title, post_date, content")
  .like("title", "%6월 9일%");

for (const p of data || []) {
  const hasContent = p.content && p.content.trim().length > 10;
  console.log(`id=${p.id} | ${p.title} | ${p.post_date} | content: ${hasContent ? p.content.length + "자" : "없음"}`);
}
