import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 불완전한 중복 게시물 삭제
const ids = [303, 301]; // 2019년 6월 16일, 6월 2일 중복

for (const id of ids) {
  // 첨부파일 먼저 삭제
  await admin.from("jubo_images").delete().eq("post_id", id);
  // 게시물 삭제
  const { error } = await admin.from("jubo_posts").delete().eq("id", id);
  console.log(`id=${id}: ${error ? "실패 - " + error.message : "삭제 완료"}`);
}
