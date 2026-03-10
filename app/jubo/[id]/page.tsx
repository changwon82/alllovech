import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";
import JuboImageList from "./JuboImageList";

const R2_JUBO = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/jubo";

export default async function JuboDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getSessionUser();

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
          href="/jubo"
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

      {/* 주보 이미지 */}
      <div className="mt-4 px-4">
        <JuboImageList
          images={allImageUrls}
          title={post.title}
        />
      </div>

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user?.id} />
    </div>
  );
}
