"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { createBudget, updateBudget } from "./actions";
import type { Budget } from "./BudgetTable";

type Props = {
  mode: "create" | "edit";
  budget?: Budget;
  onClose: () => void;
};

export default function BudgetForm({ mode, budget, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    // 잔액 자동 계산
    const budgetVal = parseInt(formData.get("budget") as string, 10) || 0;
    const spendingVal = parseInt(formData.get("spending") as string, 10) || 0;
    formData.set("balance", String(budgetVal - spendingVal));

    startTransition(async () => {
      const action = mode === "create" ? createBudget : updateBudget;
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  const inputClass = "w-full border border-neutral-200 px-3 py-2 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy";
  const labelClass = "bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-700 whitespace-nowrap";

  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-3">
          <h3 className="text-base font-bold text-navy">
            {mode === "create" ? "예산 추가" : "예산 수정"}
          </h3>
          <button onClick={onClose} className="text-xl text-neutral-400 hover:text-neutral-600">&times;</button>
        </div>

        {error && (
          <div className="mx-6 mt-3 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {mode === "edit" && budget && (
            <input type="hidden" name="id" value={budget.id} />
          )}

          <table className="w-full border-collapse border border-neutral-200 text-sm">
            <tbody>
              <tr className="border-b border-neutral-200">
                <td className={labelClass}>년도</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="year" required defaultValue={budget?.year || currentYear} className={inputClass} />
                </td>
                <td className={labelClass}>그룹코드</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="bg_code" defaultValue={budget?.bg_code || ""} placeholder="A010" className={inputClass} />
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className={labelClass}>조직명</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="committee" defaultValue={budget?.committee || ""} className={inputClass} />
                </td>
                <td className={labelClass}>계정이름</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="account" required defaultValue={budget?.account || ""} className={inputClass} />
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className={labelClass}>예산</td>
                <td className="px-2 py-1.5">
                  <input type="number" name="budget" defaultValue={budget?.budget || 0} className={inputClass} />
                </td>
                <td className={labelClass}>실적</td>
                <td className="px-2 py-1.5">
                  <input type="number" name="spending" defaultValue={budget?.spending || 0} className={inputClass} />
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className={labelClass}>조직장</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="chairman" defaultValue={budget?.chairman || ""} className={inputClass} />
                </td>
                <td className={labelClass}>담당자</td>
                <td className="px-2 py-1.5">
                  <input type="text" name="manager" defaultValue={budget?.manager || ""} className={inputClass} />
                </td>
              </tr>
              <tr>
                <td className={labelClass}>예산설명</td>
                <td className="px-2 py-1.5" colSpan={3}>
                  <textarea name="purpose" rows={3} defaultValue={budget?.purpose || ""} className={`${inputClass} resize-y`} />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-navy px-6 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isPending ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-neutral-200 px-6 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-300 active:scale-95"
            >
              닫기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
