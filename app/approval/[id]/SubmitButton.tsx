"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitForApproval } from "./actions";

export default function SubmitButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!confirm("결재요청을 하시겠습니까?\n요청 후에는 수정이 제한됩니다.")) return;

    startTransition(async () => {
      const result = await submitForApproval(postId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={isPending}
      className="rounded border border-navy bg-navy px-4 py-1.5 text-sm font-medium text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
    >
      {isPending ? "요청 중..." : "결재요청"}
    </button>
  );
}
