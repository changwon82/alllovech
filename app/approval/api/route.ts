import { getSessionUser } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.json({ posts: [], nameMap: {} }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const offset = parseInt(sp.get("offset") || "0", 10);
  const limit = parseInt(sp.get("limit") || "100", 10);
  const search = sp.get("q") || "";
  const searchField = sp.get("sf") || "title";
  const category = sp.get("cat") || "";
  const dateFrom = sp.get("from") || "";
  const dateTo = sp.get("to") || "";

  let query = supabase
    .from("approval_posts")
    .select(
      "id, title, author_name, requester_mb_id, amount, doc_category, doc_status, account_name, approver1_mb_id, approver1_status, approver2_mb_id, approver2_status, finance_status, payment_status, post_date, hit_count"
    )
    .order("id", { ascending: false });

  if (search) {
    const fieldMap: Record<string, string> = { title: "title", id: "id", author: "author_name", account: "account_name", content: "content" };
    const col = fieldMap[searchField] || "title";
    if (searchField === "id") {
      const numVal = parseInt(search, 10);
      if (!isNaN(numVal)) query = query.eq("id", numVal);
    } else {
      query = query.ilike(col, `%${search}%`);
    }
  }
  if (dateFrom) query = query.gte("post_date", `${dateFrom}T00:00:00`);
  if (dateTo) query = query.lte("post_date", `${dateTo}T23:59:59`);
  if (category) {
    if (category === "기타품의") {
      query = query.or("doc_category.is.null,doc_category.eq.");
    } else {
      query = query.eq("doc_category", category);
    }
  }

  const { data: posts } = await query.range(offset, offset + limit - 1);

  // 회원명 조회
  const mbIds = new Set<string>();
  for (const p of posts || []) {
    if (p.requester_mb_id) mbIds.add(p.requester_mb_id);
    if (p.approver1_mb_id) mbIds.add(p.approver1_mb_id);
    if (p.approver2_mb_id) mbIds.add(p.approver2_mb_id);
  }
  const { data: members } = mbIds.size > 0
    ? await supabase.from("cafe24_members").select("mb_id, name").in("mb_id", Array.from(mbIds))
    : { data: [] };
  const nameMap: Record<string, string> = {};
  for (const m of members || []) nameMap[m.mb_id] = m.name;

  return NextResponse.json({ posts: posts || [], nameMap });
}
