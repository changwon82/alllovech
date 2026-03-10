import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/server";
import PageHeader from "@/app/components/ui/PageHeader";
import BottomNav from "@/app/components/BottomNav";
import SermonList from "./SermonList";

const CATEGORIES = [
  "전체",
  "주일예배",
  "수요여성예배",
  "새벽기도회",
  "수요저녁예배",
  "금요기도회",
  "로마서강해",
  "욥기강해",
];

export default async function SermonPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || "전체";
  const page = parseInt(params.page || "1", 10);
  const perPage = 20;

  const [{ supabase, user }, _] = await Promise.all([
    getSessionUser(),
    Promise.resolve(),
  ]);

  let query = supabase
    .from("sermons")
    .select("id, title, preacher, sermon_date, scripture, category, youtube_url", { count: "exact" })
    .order("sermon_date", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (category !== "전체") {
    query = query.eq("category", category);
  }

  const { data: sermons, count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);

  // 관리자 여부 확인
  let isAdmin = false;
  if (user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "ADMIN")
      .maybeSingle();
    isAdmin = !!roles;
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20">
      <PageHeader title="설교" />

      {/* 카테고리 필터 */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={cat === "전체" ? "/sermon" : `/sermon?category=${encodeURIComponent(cat)}`}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              category === cat
                ? "bg-navy text-white"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }`}
          >
            {cat}
          </a>
        ))}
      </div>

      {/* 설교 목록 */}
      <SermonList sermons={sermons || []} />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/sermon?category=${encodeURIComponent(category)}&page=${page - 1}`}
              className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100"
            >
              이전
            </a>
          )}
          <span className="text-sm text-neutral-400">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/sermon?category=${encodeURIComponent(category)}&page=${page + 1}`}
              className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100"
            >
              다음
            </a>
          )}
        </div>
      )}

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user?.id} />
    </div>
  );
}
