import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: post } = await sb.from("news_posts").select("id, title, content").ilike("title", "%인터넷 예배%지침%").single();
if (!post) { console.log("not found"); process.exit(); }

console.log("ID:", post.id);
console.log("Content length:", post.content?.length);
console.log("Content:\n", post.content?.substring(0, 1000));

const { data: files } = await sb.from("news_files").select("*").eq("post_id", post.id);
console.log("\nFiles:", JSON.stringify(files));
