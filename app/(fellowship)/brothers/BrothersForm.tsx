"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { createBrothersPost, updateBrothersPost } from "./actions";
import RichEditor from "@/app/components/ui/RichEditor";
import { todayKST } from "@/lib/date";

type Props = {
  mode: "create" | "edit";
  post?: {
    id: number;
    title: string;
    content: string;
    post_date: string;
    author: string;
  };
};

export default function BrothersForm({ mode, post }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const action = mode === "create" ? createBrothersPost : updateBrothersPost;
      const result = await action(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        router.push(`/brothers/${result.id}`);
        router.refresh();
      }
    });
  }

  const today = todayKST();
  const dateValue = post?.post_date ? post.post_date.slice(0, 10) : today;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 수정 시 ID 전달 */}
      {mode === "edit" && post && (
        <input type="hidden" name="id" value={post.id} />
      )}

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 제목 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          제목 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          defaultValue={post?.title || ""}
          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy"
          placeholder="제목을 입력하세요"
        />
      </div>

      {/* 날짜 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          날짜
        </label>
        <input
          type="date"
          name="post_date"
          defaultValue={dateValue}
          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy"
        />
      </div>

      {/* 작성자 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          작성자
        </label>
        <input
          type="text"
          name="author"
          defaultValue={post?.author || "다애교회"}
          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy"
        />
      </div>

      {/* 본문 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          내용
        </label>
        <RichEditor
          name="content"
          defaultValue={post?.content || ""}
          placeholder="내용을 입력하세요"
          rows={12}
          folder="brothers"
        />
      </div>

      {/* 버튼 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {isPending
            ? "저장 중..."
            : mode === "create"
              ? "등록"
              : "수정"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-200 active:scale-95"
        >
          취소
        </button>
      </div>
    </form>
  );
}
