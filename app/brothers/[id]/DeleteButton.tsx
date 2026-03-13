"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteBrothersPost } from "../actions";

export default function DeleteButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    startTransition(async () => {
      const result = await deleteBrothersPost(postId);
      if (result.error) {
        alert(result.error);
      } else {
        router.push("/brothers");
        router.refresh();
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50"
    >
      {isPending ? "삭제 중..." : "삭제"}
    </button>
  );
}
