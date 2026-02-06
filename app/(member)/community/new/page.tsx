"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/src/components/Container";
import { createClient } from "@/src/lib/supabase/client";
import { POST_CATEGORY_LABEL } from "@/src/types/database";
import type { Post } from "@/src/types/database";

const categories: Post["category"][] = ["general", "prayer", "testimony"];

export default function NewPostPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Post["category"]>("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("posts").insert({
      title,
      content,
      category,
      author_id: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/community");
    router.refresh();
  };

  return (
    <Container as="main" className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold">새 글 작성</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* 카테고리 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            카테고리
          </label>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  category === cat
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                {POST_CATEGORY_LABEL[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            제목
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-800"
          />
        </div>

        {/* 내용 */}
        <div>
          <label
            htmlFor="content"
            className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-800"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? "게시 중..." : "게시하기"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-neutral-300 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            취소
          </button>
        </div>
      </form>
    </Container>
  );
}
