"use client";

import { useTransition } from "react";
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
}: {
  postId: number;
  approver1Approved: boolean;
  approver2Approved: boolean;
  financeApproved: boolean;
  paymentApproved: boolean;
  hasApprover2: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAction(field: StatusField, action: "approve" | "reject" | "execute") {
    const labels: Record<string, string> = {
      approve: "승인",
      reject: "승인 취소",
      execute: "집행",
    };
    if (!confirm(`${labels[action]} 처리하시겠습니까?`)) return;

    startTransition(async () => {
      const result = await updateApprovalStatus(postId, field, action);
      if (result.error) {
        alert(result.error);
      } else {
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
      <div className="space-y-3">
        {/* 1차 결재 */}
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <span className="text-sm font-medium text-neutral-700">1차결재</span>
          <div className="flex items-center gap-2">
            {approver1Approved ? (
              <>
                <span className="text-xs text-green-600">승인완료</span>
                <button
                  onClick={() => handleAction("approver1_status", "reject")}
                  disabled={isPending}
                  className={btnReject}
                >
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={() => handleAction("approver1_status", "approve")}
                disabled={isPending}
                className={btnApprove}
              >
                승인
              </button>
            )}
          </div>
        </div>

        {/* 최종 결재 */}
        {hasApprover2 && (
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
            <span className="text-sm font-medium text-neutral-700">최종결재</span>
            <div className="flex items-center gap-2">
              {approver2Approved ? (
                <>
                  <span className="text-xs text-green-600">승인완료</span>
                  <button
                    onClick={() => handleAction("approver2_status", "reject")}
                    disabled={isPending}
                    className={btnReject}
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleAction("approver2_status", "approve")}
                  disabled={isPending}
                  className={btnApprove}
                >
                  승인
                </button>
              )}
            </div>
          </div>
        )}

        {/* 재정결재 */}
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <span className="text-sm font-medium text-neutral-700">재정결재</span>
          <div className="flex items-center gap-2">
            {financeApproved ? (
              <>
                <span className="text-xs text-green-600">승인완료</span>
                <button
                  onClick={() => handleAction("finance_status", "reject")}
                  disabled={isPending}
                  className={btnReject}
                >
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={() => handleAction("finance_status", "approve")}
                disabled={isPending}
                className={btnApprove}
              >
                승인
              </button>
            )}
          </div>
        </div>

        {/* 지급 집행 */}
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <span className="text-sm font-medium text-neutral-700">지급집행</span>
          <div className="flex items-center gap-2">
            {paymentApproved ? (
              <>
                <span className="text-xs text-accent">집행완료</span>
                <button
                  onClick={() => handleAction("payment_status", "reject")}
                  disabled={isPending}
                  className={btnReject}
                >
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={() => handleAction("payment_status", "execute")}
                disabled={isPending}
                className={btnExecute}
              >
                집행
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
