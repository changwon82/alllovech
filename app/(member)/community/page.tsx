import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";
import { POST_CATEGORY_LABEL } from "@/src/types/database";
import type { Post } from "@/src/types/database";
import { getProfileName } from "@/src/lib/utils";

export const metadata = { title: "커뮤니티 — alllovech" };

export default async function CommunityPage() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, category, created_at, author_id, profiles(name)")
    .order("created_at", { ascending: false });

  return (
    <Container as="main" className="py-8 sm:py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">커뮤니티</h1>
        <Link
          href="/community/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          글쓰기
        </Link>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-500">
          데이터를 불러오지 못했습니다.
        </p>
      ) : !posts || posts.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400 dark:text-neutral-500">
            아직 작성된 글이 없습니다.
          </p>
          <Link
            href="/community/new"
            className="mt-3 text-sm font-medium text-neutral-900 underline underline-offset-2 dark:text-white"
          >
            첫 글을 작성해 보세요
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {posts.map((post) => {
            const authorName = getProfileName(post.profiles);
            return (
              <li key={post.id}>
                <Link
                  href={`/community/${post.id}`}
                  className="group block rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md sm:p-5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold leading-snug group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                      {post.title}
                    </h2>
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {POST_CATEGORY_LABEL[
                        post.category as Post["category"]
                      ] ?? post.category}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500">
                    <span>{authorName || "익명"}</span>
                    <span>·</span>
                    <time>
                      {new Date(post.created_at).toLocaleDateString("ko-KR")}
                    </time>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
