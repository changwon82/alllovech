"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateApprovalStatus } from "./actions";

type StatusField = "approver1_status" | "approver2_status" | "finance_status" | "payment_status";

export default function ApprovalActions({
  postId,
  approver1Approved,
  approver2Approved,
  financeApproved,
  paymentApproved,
  hasApprover2,
  currentUserMbId,
  approver1MbId,
  approver2MbId,
  isAdmin,
}: {
  postId: number;
  approver1Approved: boolean;
  approver2Approved: boolean;
  financeApproved: boolean;
  paymentApproved: boolean;
  hasApprover2: boolean;
  currentUserMbId: string | null;
  approver1MbId: string | null;
  approver2MbId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const canApprove1 = isAdmin || currentUserMbId === approver1MbId;
  const canApprove2 = isAdmin || currentUserMbId === approver2MbId;
  const canFinance = isAdmin;
  const canPayment = isAdmin;

  if (!canApprove1 && !canApprove2 && !canFinance && !canPayment) return null;

  function handleAction(field: StatusField, action: "approve" | "reject" | "execute") {
    const labels: Record<string, string> = {
      approve: "승인",
      reject: "승인 취소",
      execute: "집행",
    };
    if (!confirm(`${labels[action]} 처리하시겠습니까?`)) return;

    const comment = commentRef.current?.value || "";

    startTransition(async () => {
      const result = await updateApprovalStatus(postId, field, action, comment);
      if (result.error) {
        alert(result.error);
      } else {
        if (commentRef.current) commentRef.current.value = "";
        router.refresh();
      }
    });
  }

  const btnApprove =
    "rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50";
  const btnReject =
    "rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-all hover:bg-neutral-50 active:scale-95 disabled:opacity-50";
  const btnExecute =
    "rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-neutral-700">결재 처리</h3>

      {/* 결재의견 입력 */}
      <textarea
        ref={commentRef}
        placeholder="결재의견을 입력하세요 (선택사항)"
        rows={2}
        className="mb-4 w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-navy focus:ring-1 focus:ring-navy"
      />

      <div className="space-y-3">
        {canApprove1 && (
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
            <span className="text-sm font-medium text-neutral-700">1차결재</span>
            <div className="flex items-center gap-2">
              {approver1Approved ? (
                <>
                  <span className="text-xs text-green-600">승인완료</span>
                  <button onClick={() => handleAction("approver1_status", "reject")} disabled={isPending} className={btnReject}>취소</button>
                </>
              ) : (
                <button onClick={() => handleAction("approver1_status", "approve")} disabled={isPending} className={btnApprove}>승인</button>
              )}
            </div>
          </div>
        )}

        {hasApprover2 && canApprove2 && (
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
            <span className="text-sm font-medium text-neutral-700">최종결재</span>
            <div className="flex items-center gap-2">
              {approver2Approved ? (
                <>
                  <span className="text-xs text-green-600">승인완료</span>
                  <button onClick={() => handleAction("approver2_status", "reject")} disabled={isPending} className={btnReject}>취소</button>
                </>
              ) : (
                <button onClick={() => handleAction("approver2_status", "approve")} disabled={isPending} className={btnApprove}>승인</button>
              )}
            </div>
          </div>
        )}

        {canFinance && (
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
            <span className="text-sm font-medium text-neutral-700">재정결재</span>
            <div className="flex items-center gap-2">
              {financeApproved ? (
                <>
                  <span className="text-xs text-green-600">승인완료</span>
                  <button onClick={() => handleAction("finance_status", "reject")} disabled={isPending} className={btnReject}>취소</button>
                </>
              ) : (
                <button onClick={() => handleAction("finance_status", "approve")} disabled={isPending} className={btnApprove}>승인</button>
              )}
            </div>
          </div>
        )}

        {canPayment && (
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
            <span className="text-sm font-medium text-neutral-700">지급집행</span>
            <div className="flex items-center gap-2">
              {paymentApproved ? (
                <>
                  <span className="text-xs text-accent">집행완료</span>
                  <button onClick={() => handleAction("payment_status", "reject")} disabled={isPending} className={btnReject}>취소</button>
                </>
              ) : (
                <button onClick={() => handleAction("payment_status", "execute")} disabled={isPending} className={btnExecute}>집행</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
