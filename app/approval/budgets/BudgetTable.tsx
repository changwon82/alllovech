"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BudgetForm from "./BudgetForm";
import { deleteBudget } from "./actions";

export type Budget = {
  id: number;
  year: string;
  bg_code: string | null;
  committee: string | null;
  account: string;
  budget: number;
  spending: number;
  balance: number;
  purpose: string | null;
  chairman: string | null;
  manager: string | null;
};

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

export default function BudgetTable({ budgets }: { budgets: Budget[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Budget | null>(null);
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: number, account: string) {
    if (!confirm(`"${account}" 예산을 삭제하시겠습니까?`)) return;
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      await deleteBudget(fd);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          자료수 : {budgets.length}개
        </p>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          예산 추가
        </button>
      </div>

      <div className="mt-2 overflow-x-auto bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-xs">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
              <th className="w-10 whitespace-nowrap px-2 py-2 text-center font-medium">번호</th>
              <th className="w-10 whitespace-nowrap px-2 py-2 text-center font-medium">id</th>
              <th className="w-12 whitespace-nowrap px-2 py-2 text-center font-medium">년도</th>
              <th className="w-14 whitespace-nowrap px-2 py-2 text-center font-medium">그룹</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">조직명</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">계정이름</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">예산</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">실적</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">잔액</th>
              <th className="whitespace-nowrap px-2 py-2 text-left font-medium">예산설명</th>
              <th className="w-16 whitespace-nowrap px-2 py-2 text-center font-medium">조직장</th>
              <th className="w-16 whitespace-nowrap px-2 py-2 text-center font-medium">담당자</th>
              <th className="w-10 whitespace-nowrap px-2 py-2 text-center font-medium">삭제</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b, i) => (
              <tr
                key={b.id}
                className="border-b border-neutral-50 transition-colors hover:bg-neutral-50"
              >
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-400">{i + 1}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-400">{b.id}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-500">{b.year}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-500">{b.bg_code || ""}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-600">{b.committee || ""}</td>
                <td
                  className="cursor-pointer whitespace-nowrap px-2 py-1.5 text-center font-medium text-blue-600 hover:underline"
                  onClick={() => setEditing(b)}
                >
                  {b.account}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right text-neutral-700">{fmt(b.budget)}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right text-neutral-700">{fmt(b.spending)}</td>
                <td className={`whitespace-nowrap px-2 py-1.5 text-right font-medium ${b.balance < 0 ? "text-red-500" : "text-neutral-700"}`}>
                  {fmt(b.balance)}
                </td>
                <td className="max-w-[300px] truncate px-2 py-1.5 text-neutral-500">{b.purpose || ""}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-500">{b.chairman || ""}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center text-neutral-500">{b.manager || ""}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-center">
                  <button
                    onClick={() => handleDelete(b.id, b.account)}
                    disabled={isPending}
                    className="text-neutral-300 transition hover:text-red-500 disabled:opacity-50"
                    title="삭제"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && <BudgetForm mode="create" onClose={() => setCreating(false)} />}
      {editing && <BudgetForm mode="edit" budget={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
