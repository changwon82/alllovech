"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitApproval } from "./actions";

const DOC_CATEGORIES = ["일반재정청구", "건축재정청구", "예산전용품의", "사전품의", "기타품의"];

type Member = { mb_id: string; name: string };
type Budget = {
  id: number;
  year: string;
  committee: string;
  account: string;
  budget: number;
  spending: number;
  balance: number;
  purpose: string;
  chairman: string;
  manager: string;
};
type ItemRow = {
  item_name: string;
  standard: string;
  quantity: number;
  unit_price: number;
  note: string;
};

export default function ApprovalForm({
  authorName,
  members,
  budgets,
  budgetYear,
}: {
  authorName: string;
  members: Member[];
  budgets: Budget[];
  budgetYear: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 결재선
  const [approver1, setApprover1] = useState("");
  const [approver2, setApprover2] = useState("");

  // 문서분류
  const [docCategory, setDocCategory] = useState("");

  // 예산 계정
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId) || null;

  // 청구금액
  const [claimAmount, setClaimAmount] = useState<number>(0);

  // 문서제목
  const [title, setTitle] = useState("");

  // 본문
  const [content, setContent] = useState("");

  // 세부항목
  const [items, setItems] = useState<ItemRow[]>([
    { item_name: "", standard: "", quantity: 1, unit_price: 0, note: "" },
  ]);

  // 첨부파일
  const [files, setFiles] = useState<File[]>([]);

  const itemsTotal = items.reduce((s, r) => s + r.quantity * r.unit_price, 0);

  function addItem() {
    setItems([...items, { item_name: "", standard: "", quantity: 1, unit_price: 0, note: "" }]);
  }
  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }
  function updateItem(idx: number, field: keyof ItemRow, value: string | number) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }
  function removeFile(idx: number) {
    setFiles(files.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!docCategory) return alert("문서분류를 선택해주세요.");
    if (!approver1) return alert("1차결재자를 선택해주세요.");
    if (!title.trim()) return alert("문서제목을 입력해주세요.");

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("content", content);
    formData.set("doc_category", docCategory);
    formData.set("approver1_mb_id", approver1);
    if (approver2) formData.set("approver2_mb_id", approver2);
    formData.set("amount", String(claimAmount || itemsTotal));
    if (selectedBudgetId) formData.set("budget_id", String(selectedBudgetId));
    if (selectedBudget) formData.set("account_name", selectedBudget.account);
    formData.set("items", JSON.stringify(items.filter((r) => r.item_name.trim())));
    for (const file of files) {
      formData.append("files", file);
    }

    startTransition(async () => {
      const result = await submitApproval(formData);
      if (result.error) {
        alert(result.error);
      } else {
        router.push(`/approval/${result.id}`);
      }
    });
  }

  return (
    <div className="mt-4 space-y-5">
      {/* 결재선 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">결재선</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-neutral-500">
              <th className="px-3 py-2 text-center font-medium">구분</th>
              <th className="px-3 py-2 text-center font-medium">작성자</th>
              <th className="px-3 py-2 text-center font-medium">1차결재</th>
              <th className="px-3 py-2 text-center font-medium">최종결재</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-50">
              <td className="px-3 py-2 text-center text-neutral-500">결재선</td>
              <td className="px-3 py-2 text-center font-medium text-neutral-700">{authorName}</td>
              <td className="px-3 py-2 text-center">
                <select
                  value={approver1}
                  onChange={(e) => setApprover1(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm focus:border-navy focus:outline-none"
                >
                  <option value="">== 선택 ==</option>
                  {members.map((m) => (
                    <option key={m.mb_id} value={m.mb_id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2 text-center">
                <select
                  value={approver2}
                  onChange={(e) => setApprover2(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm focus:border-navy focus:outline-none"
                >
                  <option value="">== 선택 ==</option>
                  {members.map((m) => (
                    <option key={m.mb_id} value={m.mb_id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 문서분류 + 예산계정 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              문서분류 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DOC_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDocCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                    docCategory === cat
                      ? "bg-navy text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 예산 선택 */}
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            {budgetYear}년 계정이름
          </label>
          <select
            value={selectedBudgetId ?? ""}
            onChange={(e) => setSelectedBudgetId(e.target.value ? Number(e.target.value) : null)}
            className="w-full max-w-md rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-navy focus:outline-none"
          >
            <option value="">== 선택 ==</option>
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.account} ({b.committee})
              </option>
            ))}
          </select>
        </div>

        {/* 예산 정보 표시 */}
        {selectedBudget && (
          <div className="mt-3 flex flex-wrap gap-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm">
            <div>
              <span className="text-neutral-500">예산</span>{" "}
              <span className="font-medium text-neutral-700">
                {(selectedBudget.budget || 0).toLocaleString("ko-KR")}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">실적</span>{" "}
              <span className="font-medium text-neutral-700">
                {(selectedBudget.spending || 0).toLocaleString("ko-KR")}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">잔액</span>{" "}
              <span className="font-medium text-navy">
                {(selectedBudget.balance || 0).toLocaleString("ko-KR")}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">청구금액</span>{" "}
              <input
                type="number"
                value={claimAmount || ""}
                onChange={(e) => setClaimAmount(Number(e.target.value))}
                placeholder="0"
                className="w-28 rounded-lg border border-neutral-200 px-2 py-1 text-right text-sm focus:border-navy focus:outline-none"
              />
            </div>
            <div>
              <span className="text-neutral-500">조직장</span>{" "}
              <span className="text-neutral-600">{selectedBudget.chairman || "-"}</span>
            </div>
            <div>
              <span className="text-neutral-500">담당자</span>{" "}
              <span className="text-neutral-600">{selectedBudget.manager || "-"}</span>
            </div>
          </div>
        )}
      </div>

      {/* 문서제목 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          문서제목
        </label>
        <p className="mb-2 text-xs text-red-500">
          1.결재선 2.문서분류 3.참조부서(본인/결재부서) 4.참조인원 확인 후 문서제목(최대 22자) 입력
        </p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={22}
          placeholder="문서 제목을 입력하세요"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-navy focus:outline-none"
        />
      </div>

      {/* 본문 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">본문 내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="문서분류를 선택하시면 청구서 양식이 나옵니다."
          className="w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-navy focus:outline-none"
        />
      </div>

      {/* 세부항목 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-700">세부항목</h3>
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200"
          >
            + 항목추가
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-500">
                <th className="px-2 py-2 text-left font-medium">품목명</th>
                <th className="px-2 py-2 text-left font-medium">규격</th>
                <th className="w-20 px-2 py-2 text-right font-medium">수량</th>
                <th className="w-28 px-2 py-2 text-right font-medium">단가</th>
                <th className="w-28 px-2 py-2 text-right font-medium">금액</th>
                <th className="px-2 py-2 text-left font-medium">비고</th>
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-neutral-50">
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => updateItem(i, "item_name", e.target.value)}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-sm focus:border-navy focus:outline-none"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={item.standard}
                      onChange={(e) => updateItem(i, "standard", e.target.value)}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-sm focus:border-navy focus:outline-none"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-right text-sm focus:border-navy focus:outline-none"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      value={item.unit_price || ""}
                      onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-right text-sm focus:border-navy focus:outline-none"
                    />
                  </td>
                  <td className="px-1 py-1 text-right font-medium text-neutral-700">
                    {(item.quantity * item.unit_price).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => updateItem(i, "note", e.target.value)}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-sm focus:border-navy focus:outline-none"
                    />
                  </td>
                  <td className="px-1 py-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-neutral-200 bg-neutral-50 font-semibold">
                <td colSpan={4} className="px-2 py-2 text-right text-neutral-600">
                  합계
                </td>
                <td className="px-2 py-2 text-right text-navy">
                  {itemsTotal.toLocaleString("ko-KR")}원
                </td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 첨부파일 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">첨부파일</h3>
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-neutral-600">{file.name}</span>
              <span className="shrink-0 text-xs text-neutral-400">
                {(file.size / 1024).toFixed(0)}KB
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 text-neutral-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-600">
            <span>+ 파일 선택</span>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-xl bg-navy px-8 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "저장 중..." : "작성완료"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/approval")}
          className="rounded-xl border border-neutral-300 px-8 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-50 active:scale-95"
        >
          작성취소
        </button>
      </div>
    </div>
  );
}
