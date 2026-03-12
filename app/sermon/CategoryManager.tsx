"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategory,
} from "./actions";

type Category = { id: number; name: string; sort_order: number };

export default function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const result = await createCategory(newName.trim());
    if (result.error) {
      alert(result.error);
      return;
    }
    setNewName("");
    refresh();
  }

  async function handleUpdate(id: number) {
    if (!editName.trim()) return;
    const result = await updateCategory(id, editName.trim());
    if (result.error) {
      alert(result.error);
      return;
    }
    setEditId(null);
    refresh();
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return;
    const result = await deleteCategory(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    refresh();
  }

  async function handleReorder(id: number, direction: "up" | "down") {
    const result = await reorderCategory(id, direction);
    if (result.error) alert(result.error);
    refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="ml-1 shrink-0 rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
        title="카테고리 관리"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-700">카테고리 관리</h3>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* 카테고리 목록 */}
      <div className="space-y-1">
        {categories.map((cat, i) => (
          <div
            key={cat.id}
            className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-neutral-50"
          >
            {/* 순서 */}
            <div className="flex flex-col">
              <button
                onClick={() => handleReorder(cat.id, "up")}
                disabled={i === 0 || isPending}
                className="text-neutral-300 transition hover:text-neutral-600 disabled:opacity-30"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 15.75 7.5-7.5 7.5 7.5"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleReorder(cat.id, "down")}
                disabled={i === categories.length - 1 || isPending}
                className="text-neutral-300 transition hover:text-neutral-600 disabled:opacity-30"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
            </div>

            {/* 이름 */}
            {editId === cat.id ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate(cat.id);
                  if (e.key === "Escape") setEditId(null);
                }}
                autoFocus
                className="flex-1 rounded-lg border border-navy/30 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-navy/30"
              />
            ) : (
              <span className="flex-1 text-sm text-neutral-700">
                {cat.name}
              </span>
            )}

            {/* 버튼 */}
            <div className="flex items-center gap-1">
              {editId === cat.id ? (
                <>
                  <button
                    onClick={() => handleUpdate(cat.id)}
                    disabled={isPending}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-navy transition hover:bg-navy/10"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="rounded-lg px-2 py-1 text-xs text-neutral-400 transition hover:bg-neutral-100"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditId(cat.id);
                      setEditName(cat.name);
                    }}
                    disabled={isPending}
                    className="rounded-lg px-2 py-1 text-xs text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    disabled={isPending}
                    className="rounded-lg px-2 py-1 text-xs text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 추가 */}
      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 카테고리 이름"
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm transition focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/30"
        />
        <button
          type="submit"
          disabled={isPending || !newName.trim()}
          className="shrink-0 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          추가
        </button>
      </form>
    </div>
  );
}
