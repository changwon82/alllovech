"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteApprovalPost } from "./actions";

export default function DeleteButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("이 문서를 삭제하시겠습니까?\n첨부파일도 함께 삭제됩니다.")) return;

    startTransition(async () => {
      const result = await deleteApprovalPost(postId);
      if (result.error) {
        alert(result.error);
      } else {
        router.push("/approval");
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded border border-red-300 px-4 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-50 active:scale-95 disabled:opacity-50"
    >
      {isPending ? "삭제 중..." : "문서 삭제"}
    </button>
  );
}
