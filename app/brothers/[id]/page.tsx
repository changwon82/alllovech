import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";

export default async function BrothersDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getSessionUser();

  const { data: post } = await supabase
    .from("brothers_posts")
    .select("*")
    .eq("id", parseInt(id, 10))
    .single();

  if (!post) notFound();

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
    <div className="mx-auto min-h-screen max-w-2xl pb-20">
      <div className="px-4 pt-4">
        <Link
          href="/brothers"
          className="mb-3 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
        >
          ← 목록으로
        </Link>

        <h1 className="text-xl font-bold text-neutral-800">{post.title}</h1>

        <div className="mt-2 flex items-center gap-3 text-sm text-neutral-500">
          <span>{new Date(post.post_date).toLocaleDateString("ko-KR")}</span>
          <span>·</span>
          <span className="text-xs text-neutral-400">조회 {post.hit_count}</span>
        </div>
      </div>

      {/* 본문 — 원본 HTML 그대로 렌더링 (텍스트·이미지 순서 유지) */}
      {post.content && (
        <div
          className="brothers-content mt-4 px-4 text-sm leading-relaxed text-neutral-600"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}

      {/* 이미지/텍스트 스타일 */}
      <style>{`
        .brothers-content img {
          width: 100%;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        .brothers-content p {
          margin: 0.25rem 0;
        }
        .brothers-content br + br {
          display: block;
          margin-top: 0.5rem;
          content: "";
        }
      `}</style>

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user?.id} />
    </div>
  );
}
