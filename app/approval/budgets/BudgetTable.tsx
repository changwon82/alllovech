"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BudgetForm from "./BudgetForm";
import { createBudget, deleteBudget } from "./actions";

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

type InlineRow = {
  key: number;
  year: string;
  bg_code: string;
  committee: string;
  account: string;
  budget: string;
  spending: string;
  purpose: string;
  chairman: string;
  manager: string;
};

function emptyRow(key: number): InlineRow {
  return { key, year: new Date().getFullYear().toString(), bg_code: "", committee: "", account: "", budget: "0", spending: "0", purpose: "", chairman: "", manager: "" };
}

const inputClass = "w-full rounded border border-neutral-300 bg-white px-1.5 py-1 text-sm focus:border-navy focus:outline-none";

export default function BudgetTable({ budgets }: { budgets: Budget[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Budget | null>(null);
  const [isPending, startTransition] = useTransition();
  const [inlineRows, setInlineRows] = useState<InlineRow[]>([]);
  const [saving, setSaving] = useState(false);

  function handleDelete(id: number, account: string) {
    if (!confirm(`"${account}" 예산을 삭제하시겠습니까?`)) return;
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      await deleteBudget(fd);
      router.refresh();
    });
  }

  function addInlineRow() {
    setInlineRows((prev) => [...prev, emptyRow(Date.now())]);
  }

  function updateInlineRow(key: number, field: keyof InlineRow, value: string) {
    setInlineRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function removeInlineRow(key: number) {
    setInlineRows((prev) => prev.filter((r) => r.key !== key));
  }

  async function handleSave() {
    const validRows = inlineRows.filter((r) => r.account.trim());
    if (validRows.length === 0) {
      alert("계정이름을 입력해주세요.");
      return;
    }
    setSaving(true);
    for (const row of validRows) {
      const budget = parseInt(row.budget, 10) || 0;
      const spending = parseInt(row.spending, 10) || 0;
      const fd = new FormData();
      fd.set("year", row.year);
      fd.set("bg_code", row.bg_code);
      fd.set("committee", row.committee);
      fd.set("account", row.account);
      fd.set("budget", String(budget));
      fd.set("spending", String(spending));
      fd.set("balance", String(budget - spending));
      fd.set("purpose", row.purpose);
      fd.set("chairman", row.chairman);
      fd.set("manager", row.manager);
      const result = await createBudget(fd);
      if (result.error) {
        alert(`"${row.account}" 저장 실패: ${result.error}`);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setInlineRows([]);
    router.refresh();
  }

  return (
    <>
      <div className="mt-2 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-400 bg-neutral-200 text-neutral-600">
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">번호</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">id</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">년도</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">그룹</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">조직명</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">계정이름</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">예산</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">실적</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">잔액</th>
              <th className="w-full px-2 py-2 text-left font-medium">예산설명</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">조직장</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">담당자</th>
              <th className="whitespace-nowrap px-2 py-2 text-center font-medium">삭제</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b, i) => (
              <tr
                key={b.id}
                className="border-b border-neutral-300 transition-colors hover:bg-neutral-50"
              >
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-400">{i + 1}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-400">{b.id}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-500">{b.year}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-500">{b.bg_code || ""}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-600">{b.committee || ""}</td>
                <td
                  className="cursor-pointer whitespace-nowrap px-2 py-2 text-center font-medium text-blue-600 hover:underline"
                  onClick={() => setEditing(b)}
                >
                  {b.account}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right text-neutral-700">{fmt(b.budget)}</td>
                <td className="whitespace-nowrap px-2 py-2 text-right text-neutral-700">{fmt(b.spending)}</td>
                <td className={`whitespace-nowrap px-2 py-2 text-right font-medium ${b.balance < 0 ? "text-red-500" : "text-neutral-700"}`}>
                  {fmt(b.balance)}
                </td>
                <td className="px-2 py-2 text-neutral-500">{b.purpose || ""}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-500">{b.chairman || ""}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center text-neutral-500">{b.manager || ""}</td>
                <td className="whitespace-nowrap px-2 py-2 text-center">
                  <button
                    onClick={() => handleDelete(b.id, b.account)}
                    disabled={isPending}
                    className="text-neutral-300 transition hover:text-red-500 disabled:opacity-50"
                    title="삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022 1.005 11.36A2.75 2.75 0 0 0 7.757 20h4.486a2.75 2.75 0 0 0 2.738-2.439l1.005-11.36.149.022a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {/* 인라인 입력 행 */}
            {inlineRows.map((row) => {
              const budget = parseInt(row.budget, 10) || 0;
              const spending = parseInt(row.spending, 10) || 0;
              const balance = budget - spending;
              return (
                <tr key={row.key} className="border-b border-neutral-300 bg-amber-50">
                  <td className="px-2 py-1.5 text-center text-neutral-400">-</td>
                  <td className="px-2 py-1.5 text-center text-neutral-400">-</td>
                  <td className="px-1 py-1.5">
                    <input type="text" value={row.year} onChange={(e) => updateInlineRow(row.key, "year", e.target.value)} className={`${inputClass} w-16 text-center`} />
                  </td>
                  <td className="px-1 py-1.5">
                    <input type="text" value={row.bg_code} onChange={(e) => updateInlineRow(row.key, "bg_code", e.target.value)} placeholder="A010" className={`${inputClass} w-16 text-center`} />
                  </td>
                  <td className="px-1 py-1.5">
                    <input type="text" value={row.committee} onChange={(e) => updateInlineRow(row.key, "committee", e.target.value)} placeholder="조직명" className={`${inputClass} w-24`} />
                  </td>
                  <td className="px-1 py-1.5">
                    <input type="text" value={row.account} onChange={(e) => updateInlineRow(row.key, "account", e.target.value)} placeholder="계정이름" className={`${inputClass} w-24`} />
                  </td>
                  <td className="px-1 py-1.5">
                    <input type="number" value={row.budget} onChange={(e) => updateInlineRow(row.key, "budget", e.target.value)} className={`${inputClass} w-24 text-right`} />
                  </td>
                  <td className="px-1 py-1.5">
                    <input type="number" value={row.spending} onChange={(e) => updateInlineRow(row.key, "spending", e.target.value)} className={`${inputClass} w-20 text-right`} />
                  </td>
                  <td className={`whitespace-nowrap px-2 py-1.5 text-right font-medium ${balance < 0 ? "text-red-500" : "text-neutral-700"}`}>
                    {fmt(balance)}
                  </td>
                  <td className="px-1 py-1.5">
                    <input type="text" value={row.purpose} onChange={(e) => updateInlineRow(row.key, "purpose", e.target.value)} placeholder="예산설명" className={inputClass} />
                  </td>
                  <td className="px-1 py-1.5">
                    <input type="text" value={row.chairman} onChange={(e) => updateInlineRow(row.key, "chairman", e.target.value)} placeholder="조직장" className={`${inputClass} w-16`} />
                  </td>
                  <td className="px-1 py-1.5">
                    <input type="text" value={row.manager} onChange={(e) => updateInlineRow(row.key, "manager", e.target.value)} placeholder="담당자" className={`${inputClass} w-16`} />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button onClick={() => removeInlineRow(row.key)} className="text-neutral-400 transition hover:text-red-500" title="행 삭제">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-400 bg-neutral-100 font-bold text-neutral-700">
              <td colSpan={6} className="px-2 py-2 text-center">합계</td>
              <td className="whitespace-nowrap px-2 py-2 text-right">{fmt(budgets.reduce((s, b) => s + b.budget, 0))}</td>
              <td className="whitespace-nowrap px-2 py-2 text-right">{fmt(budgets.reduce((s, b) => s + b.spending, 0))}</td>
              <td className="whitespace-nowrap px-2 py-2 text-right">{fmt(budgets.reduce((s, b) => s + b.balance, 0))}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 입력 행 추가 + 저장/나가기 */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={addInlineRow}
          className="rounded bg-navy px-4 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          입력 행 추가
        </button>
      </div>

      {inlineRows.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-neutral-700 px-8 py-2 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-95 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            onClick={() => setInlineRows([])}
            className="rounded bg-neutral-400 px-8 py-2 text-sm font-medium text-white transition-all hover:bg-neutral-500 active:scale-95"
          >
            나가기
          </button>
        </div>
      )}

      {editing && <BudgetForm mode="edit" budget={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
