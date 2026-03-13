import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import Link from "next/link";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import JuboImageList from "./JuboImageList";
import PageHeader from "@/app/components/ui/PageHeader";
import DeleteButton from "./DeleteButton";

const R2_JUBO = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/jubo";

export default async function JuboDetailPage({
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

  const [{ data: post }, { data: images }] = await Promise.all([
    supabase
      .from("jubo_posts")
      .select("*")
      .eq("id", parseInt(id, 10))
      .single(),
    supabase
      .from("jubo_images")
      .select("file_name, original_name, sort_order")
      .eq("post_id", parseInt(id, 10))
      .order("sort_order"),
  ]);

  if (!post) notFound();

  // content에서 이미지 파일명 추출
  const contentImages: string[] = [];
  if (post.content) {
    const regex = /src=["']+([^"']+)["']+/g;
    let match;
    while ((match = regex.exec(post.content)) !== null) {
      const url = match[1];
      if (!/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url)) continue;
      const fileName = url.split("/").pop();
      if (fileName) contentImages.push(fileName);
    }
  }

  // 첨부파일 + content 이미지 모두 jubo/
  const attachUrls = (images || []).map((img) => `${R2_JUBO}/${img.file_name}`);
  const contentUrls = contentImages.map((name) => `${R2_JUBO}/${name}`);
  const allImageUrls = [...new Set([...attachUrls, ...contentUrls])];

  return (
    <>
      <SubpageHeader
        title="교회주보"
        breadcrumbs={[
          { label: "교제와 소식", href: "/news" },
          { label: "주보", href: "/jubo" },
        ]}
      />

      <div className="mx-auto flex max-w-5xl gap-10 px-4 py-6 pb-20 md:px-8">
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
        <PageHeader title="주보" />
        {/* 관리자 버튼 */}
        {isAdmin && (
          <div className="mt-6 flex items-center justify-end gap-2">
            <Link
              href={`/jubo/${post.id}/edit`}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-navy transition-all hover:bg-navy/10 active:scale-95"
            >
              수정
            </Link>
            <DeleteButton postId={post.id} />
          </div>
        )}

        {/* 제목 바 */}
        <div className={isAdmin ? "mt-2" : "mt-6"}>
          <div className="flex items-center justify-between border-y border-neutral-200 bg-neutral-50 px-5 py-3">
            <h1 className="text-[15px] font-bold text-neutral-800">{post.title}</h1>
            <span className="shrink-0 text-xs text-neutral-400">
              {new Date(post.post_date).toLocaleDateString("ko-KR")}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-2.5 text-xs text-neutral-400">
            <span>{post.author ?? "다애교회"}</span>
            <span>조회수 &nbsp;{post.hit_count}</span>
          </div>
        </div>

        {/* 주보 이미지 */}
        <div className="mt-6">
          <JuboImageList
            images={allImageUrls}
            title={post.title}
          />
        </div>

        {/* 목록으로 */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/jubo"
            className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            목록으로
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
