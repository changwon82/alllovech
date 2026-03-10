import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await sb
  .from("news_posts")
  .select("id, title, content")
  .order("post_date", { ascending: false })
  .limit(5);

for (const p of data || []) {
  console.log("ID:", p.id, "Title:", p.title);
  const regex = /src=["']+([^"']+)["']+/g;
  let m;
  const srcs = [];
  while ((m = regex.exec(p.content || "")) !== null) {
    srcs.push(m[1]);
  }
  console.log("  images:", srcs.length, srcs);

  const { data: files } = await sb.from("news_files").select("*").eq("post_id", p.id);
  console.log("  files:", files?.length, files);
  console.log("---");
}
