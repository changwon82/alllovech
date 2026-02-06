import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";
import { POST_CATEGORY_LABEL } from "@/src/types/database";
import type { Post } from "@/src/types/database";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles(name)")
    .eq("id", id)
    .single();

  if (!post) notFound();

  return (
    <Container as="main" className="py-8 sm:py-12">
      <Link
        href="/community"
        className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
      >
        ← 목록으로
      </Link>

      <article className="mt-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {POST_CATEGORY_LABEL[post.category as Post["category"]] ??
              post.category}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{post.title}</h1>

        <div className="mt-3 flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500">
          <span>{post.profiles?.name || "익명"}</span>
          <span>·</span>
          <time>
            {new Date(post.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>

        <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none whitespace-pre-wrap">
          {post.content}
        </div>
      </article>
    </Container>
  );
}
