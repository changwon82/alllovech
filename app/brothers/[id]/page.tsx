import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import Link from "next/link";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import PageHeader from "@/app/components/ui/PageHeader";
import DeleteButton from "./DeleteButton";
import PostContent from "@/app/components/ui/PostContent";

export default async function BrothersDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getSessionUser();

  // 관리자 확인
  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  const { data: post } = await supabase
    .from("brothers_posts")
    .select("*")
    .eq("id", parseInt(id, 10))
    .single();

  if (!post) notFound();

  return (
    <>
    <SubpageHeader
      title="교제와 소식"
      breadcrumbs={[
        { label: "교제와 소식", href: "/news" },
        { label: "교우소식", href: "/brothers" },
      ]}
    />
    <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
      <SubpageSidebar
        title="교제와 소식"
        items={[
          { label: "교회소식", href: "/news" },
          { label: "교우소식", href: "/brothers" },
          { label: "주보", href: "/jubo" },
          { label: "다애사진", href: "/gallery" },
        ]}
      />
      <div className="min-w-0 flex-1">
      <PageHeader title="교우소식" />
      {/* 관리자 버튼 */}
      {isAdmin && (
        <div className="mt-6 flex items-center justify-end gap-2">
          <Link
            href={`/brothers/${post.id}/edit`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-navy transition-all hover:bg-navy/10 active:scale-95"
          >
            수정
          </Link>
          <DeleteButton postId={post.id} />
        </div>
      )}

      {/* 글 헤더 */}
      <div className={isAdmin ? "mt-2" : "mt-6"}>
        <div className="flex items-center justify-between border-y border-neutral-200 bg-neutral-50 px-5 py-3">
          <h1 className="text-[15px] font-bold text-neutral-800">{post.title}</h1>
          <span className="shrink-0 pl-4 text-xs text-neutral-400">
            {new Date(post.post_date).toLocaleDateString("ko-KR")}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-2.5 text-xs text-neutral-400">
          <span>{post.author ?? "다애교회"}</span>
          <span>조회수 &nbsp;{post.hit_count}</span>
        </div>
      </div>

      {/* 본문 — 원본 HTML 그대로 렌더링 (텍스트·이미지 순서 유지) */}
      {post.content && (
        <PostContent
          html={post.content}
          className="brothers-content mt-4 px-4 text-sm leading-relaxed text-neutral-600"
        />
      )}

      {/* 이미지/텍스트 스타일 */}
      <style>{`
        .brothers-content img {
          width: 100%;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
          cursor: pointer;
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

    </div>
    </div>
    </>
  );
}
