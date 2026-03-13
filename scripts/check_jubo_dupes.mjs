import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 전체 주보 조회
const all = [];
let from = 0;
while (true) {
  const { data } = await admin
    .from("jubo_posts")
    .select("id, title, post_date, content")
    .order("post_date", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + 999);
  if (!data || data.length === 0) break;
  all.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}

console.log(`전체 주보: ${all.length}개\n`);

// 제목 기준 중복 찾기
const byTitle = new Map();
for (const p of all) {
  if (!byTitle.has(p.title)) byTitle.set(p.title, []);
  byTitle.get(p.title).push(p);
}

const dupes = [...byTitle.entries()].filter(([, posts]) => posts.length > 1);
console.log(`중복 제목: ${dupes.length}건\n`);

for (const [title, posts] of dupes) {
  console.log(`"${title}"`);
  for (const p of posts) {
    const hasContent = p.content && p.content.trim().length > 10;
    console.log(`  id=${p.id} | ${p.post_date} | content: ${hasContent ? p.content.length + "자" : "없음"}`);
  }
}
