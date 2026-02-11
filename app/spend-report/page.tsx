"use client";

import { useState, useRef, useEffect } from "react";
import {
  uploadReceiptImage,
  listReceiptImages,
  deleteReceiptImage,
  deleteReceiptImages,
  saveExpense,
  getExpenses,
  deleteExpense,
  type ReceiptFile,
  type ExpenseRow,
} from "./actions";
import { resizeReceiptImage } from "./resizeImage";

const BUCKET = "spend-report-receipts";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMeta(f: ReceiptFile): string {
  const parts: string[] = [];
  if (f.width != null && f.height != null) parts.push(`${f.width} × ${f.height}`);
  if (f.size != null) parts.push(formatSize(f.size));
  parts.push(`${BUCKET}/${f.path}`);
  return parts.join(" · ");
}

function formatDateWithWeekday(d: Date): string {
  const datePart = d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const w = d.toLocaleDateString("ko-KR", { weekday: "short" });
  return `${datePart} (${w})`;
}

function formatUploadDate(uploadedAt?: string): string {
  if (!uploadedAt) return "";
  return formatDateWithWeekday(new Date(uploadedAt));
}

function formatExpenseDate(dateStr: string): string {
  return formatDateWithWeekday(new Date(dateStr + "T12:00:00"));
}

export default function SpendReportPage() {
  const [uploaded, setUploaded] = useState<ReceiptFile[]>([]);
  const [serverList, setServerList] = useState<ReceiptFile[]>([]);
  const [serverListLoaded, setServerListLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [serverListModalOpen, setServerListModalOpen] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const { blob, width, height } = await resizeReceiptImage(file);
        const formData = new FormData();
        formData.append("file", blob, file.name.replace(/\.[^.]+$/, ".jpg"));
        const result = await uploadReceiptImage(formData);
        setUploaded((prev) => [
          ...prev,
          { ...result, size: blob.size, width, height, uploadedAt: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeFromBatch = async (path: string) => {
    try {
      await deleteReceiptImage(path);
      setUploaded((prev) => prev.filter((f) => f.path !== path));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    }
  };

  const loadServerList = async () => {
    setServerListLoaded(false);
    setLoading(true);
    setError(null);
    try {
      const list = await listReceiptImages();
      setServerList(list);
      setServerListLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록 불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  const deleteOnServer = async (path: string) => {
    try {
      await deleteReceiptImage(path);
      setServerList((prev) => prev.filter((f) => f.path !== path));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    }
  };

  const loadExpenses = async () => {
    if (expensesLoaded) return;
    setError(null);
    try {
      const list = await getExpenses();
      setExpenses(list);
      setExpensesLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "내역 불러오기 실패");
    }
  };

  useEffect(() => {
    loadExpenses();
    loadServerList();
  }, []);

  const handleExpenseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const amountStr = (form.querySelector('[name="expense-amount"]') as HTMLInputElement)?.value;
    const description = (form.querySelector('[name="expense-description"]') as HTMLInputElement)?.value?.trim() ?? "";
    const amount = parseInt(String(amountStr ?? "").replace(/,/g, "") || "0", 10);
    if (amount <= 0) {
      setError("금액을 입력해 주세요.");
      return;
    }
    const date = today;
    setLoading(true);
    setError(null);
    try {
      await saveExpense({ date, amount, description });
      const list = await getExpenses();
      setExpenses(list);
      setExpensesLoaded(true);
      (form.querySelector('[name="expense-amount"]') as HTMLInputElement).value = "";
      (form.querySelector('[name="expense-description"]') as HTMLInputElement).value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setLoading(false);
    }
  };

  const formatAmountInput = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const digits = el.value.replace(/\D/g, "");
    el.value = digits ? Number(digits).toLocaleString() : "";
    el.setSelectionRange(el.value.length, el.value.length);
  };

  const removeExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    }
  };

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <h1 className="text-xl font-bold text-navy">지출 보고</h1>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6 space-y-6">
        {/* 금액·내용·저장 (맨 위) */}
        <form onSubmit={handleExpenseSubmit} className="flex flex-wrap items-center gap-2">
            <input
              name="expense-amount"
              type="text"
              inputMode="numeric"
              placeholder="금액"
              onInput={formatAmountInput}
              className="w-24 rounded-lg border border-neutral-200 px-2 py-2 text-right text-sm tabular-nums"
            />
            <input
              name="expense-description"
              type="text"
              placeholder="내용"
              className="min-w-[8rem] flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-navy px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              저장
            </button>
          </form>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFile}
            className="hidden"
          />
          <div className="relative">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed py-10 text-center transition-colors ${
                isDragging ? "border-blue bg-blue/10 text-blue" : "border-neutral-300 text-neutral-500 hover:border-blue hover:bg-blue/5"
              }`}
            >
              📷 영수증 사진 올리기 (드래그 가능)
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setServerListModalOpen(true);
                  loadServerList();
                }}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                서버에 남아있는 사진 삭제
              </button>
            </div>
          </div>

          {loading && <p className="text-center text-sm text-neutral-500">업로드 중…</p>}

          {/* 사진 + 직접 입력 한 목록, 입력 순서 */}
          {(() => {
            const uploadedPaths = new Set(uploaded.map((u) => u.path));
            const photoItems = [
              ...uploaded.map((f) => ({ type: "photo" as const, source: "batch" as const, ...f, sortAt: f.uploadedAt ?? "" })),
              ...serverList
                .filter((f) => !uploadedPaths.has(f.path))
                .map((f) => ({ type: "photo" as const, source: "server" as const, ...f, sortAt: f.uploadedAt ?? "" })),
            ];
            const expenseItems = expenses.map((r) => ({ type: "expense" as const, ...r, sortAt: r.created_at }));
            const combined = [...photoItems, ...expenseItems].sort(
              (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()
            );
            if (combined.length === 0) return null;
            return (
              <ul className="space-y-2">
                {combined.map((item) =>
                  item.type === "photo" ? (
                    <li
                      key={item.path}
                      className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2"
                    >
                      <span className="text-xs text-neutral-500 shrink-0">
                        {item.uploadedAt ? formatUploadDate(item.uploadedAt) : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(item.url)}
                        className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue"
                      >
                        <img src={item.url} alt="영수증" className="h-full w-full object-cover" />
                      </button>
                      <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">{formatMeta(item)}</span>
                      <button
                        type="button"
                        onClick={() => (item.source === "batch" ? removeFromBatch(item.path) : deleteOnServer(item.path))}
                        className="shrink-0 text-xs text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </li>
                  ) : (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2"
                    >
                      <span className="text-xs text-neutral-500">{formatExpenseDate(item.date)}</span>
                      <span className="font-medium tabular-nums">{item.amount.toLocaleString()}원</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">{item.description || "—"}</span>
                      <button
                        type="button"
                        onClick={() => removeExpense(item.id)}
                        className="shrink-0 text-xs text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </li>
                  )
                )}
              </ul>
            );
          })()}
      </div>

      {/* 서버에 남아있는 사진 삭제 모달 */}
      {serverListModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setServerListModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="서버에 남아있는 사진 삭제"
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-neutral-800">서버에 남아있는 사진 삭제</h2>
              <button
                type="button"
                onClick={() => setServerListModalOpen(false)}
                className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 p-4">
              <button
                type="button"
                onClick={loadServerList}
                disabled={loading}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm"
              >
                {serverListLoaded ? "새로고침" : "목록 불러오기"}
              </button>
              {serverListLoaded && serverList.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`서버에 있는 사진 ${serverList.length}장을 모두 삭제할까요?`)) return;
                    setLoading(true);
                    setError(null);
                    try {
                      await deleteReceiptImages(serverList.map((f) => f.path));
                      setServerList([]);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "삭제 실패");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  모두삭제
                </button>
              )}
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-4 pb-4">
              {loading && !serverListLoaded && (
                <p className="py-8 text-center text-neutral-500">불러오는 중…</p>
              )}
              {serverListLoaded && serverList.length === 0 && (
                <p className="py-8 text-center text-neutral-500">서버에 저장된 사진이 없습니다.</p>
              )}
              {serverListLoaded && serverList.length > 0 && (
                <ul className="space-y-3">
                  {serverList.map((f) => (
                    <li key={f.path} className="rounded-xl border border-neutral-200 bg-white p-3">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => setPreviewUrl(f.url)}
                          className="relative shrink-0 overflow-hidden rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue"
                        >
                          <img src={f.url} alt="영수증" className="h-24 w-24 object-cover" />
                          {f.uploadedAt && (
                            <span className="absolute inset-x-0 top-0 bg-black/70 px-1 py-0.5 text-center text-[10px] font-medium text-white">
                              {formatUploadDate(f.uploadedAt)}
                            </span>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-neutral-400">{formatMeta(f)}</p>
                          <button
                            type="button"
                            onClick={() => deleteOnServer(f.path)}
                            className="mt-2 text-xs text-red-600 hover:underline"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 사진 크게 보기 모달 */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="사진 보기"
        >
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-neutral-800 hover:bg-white"
            aria-label="닫기"
          >
            ✕
          </button>
          <img
            src={previewUrl}
            alt="영수증 전체"
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
