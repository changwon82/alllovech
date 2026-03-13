"use client";

import Image from "next/image";
import { useState, useRef, useTransition } from "react";
import { createStaff, updateStaff, deleteStaff, reorderStaff } from "./actions";

type Staff = {
  id: string;
  name: string;
  role: string;
  dept: string | null;
  photo_url: string | null;
  sort_order: number;
};

function StaffForm({
  staff,
  onClose,
}: {
  staff?: Staff;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = staff
        ? await updateStaff(staff.id, fd)
        : await createStaff(fd);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-3">
        <input
          name="name"
          placeholder="이름"
          defaultValue={staff?.name ?? ""}
          required
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          name="role"
          placeholder="직분 (예: 담임목사)"
          defaultValue={staff?.role ?? ""}
          required
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          name="dept"
          placeholder="담당 (선택)"
          defaultValue={staff?.dept ?? ""}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          name="photo"
          type="file"
          accept="image/*"
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "저장중..." : staff ? "수정" : "추가"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition-all hover:bg-neutral-50 active:scale-95"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export function EditToggle({
  isAdmin,
  editMode,
  setEditMode,
}: {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
}) {
  if (!isAdmin) return null;
  return editMode ? (
    <button
      onClick={() => setEditMode(false)}
      className="rounded-full p-1.5 text-navy transition-all hover:bg-navy/5 active:scale-95"
      title="수정 완료"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    </button>
  ) : (
    <button
      onClick={() => setEditMode(true)}
      className="rounded-full p-1.5 text-neutral-400 transition-all hover:text-navy active:scale-95"
      title="수정"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
      </svg>
    </button>
  );
}

export default function StaffClient({
  staffList,
  isAdmin,
  editMode,
}: {
  staffList: Staff[];
  isAdmin: boolean;
  editMode: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`${name}님을 삭제하시겠습니까?`)) return;
    startTransition(async () => {
      const result = await deleteStaff(id);
      if (result.error) alert(result.error);
    });
  }

  function handleMove(id: string, direction: "up" | "down") {
    startTransition(async () => {
      const result = await reorderStaff(id, direction);
      if (result.error) alert(result.error);
    });
  }

  return (
    <>
      <div className="space-y-4">
        {staffList.map((s) =>
          editingId === s.id ? (
            <StaffForm
              key={s.id}
              staff={s}
              onClose={() => setEditingId(null)}
            />
          ) : (
            <div
              key={s.id}
              className="flex items-center gap-4 bg-white p-4 shadow-sm"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                {s.photo_url ? (
                  <Image
                    src={s.photo_url}
                    alt={`${s.role} ${s.name}`}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-neutral-300">
                    {s.name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-navy">{s.name}</p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {s.role}
                  {s.dept && ` · ${s.dept}`}
                </p>
              </div>
              {editMode && (
                <div className="flex shrink-0 items-center gap-1">
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleMove(s.id, "up")}
                      disabled={isPending || staffList.indexOf(s) === 0}
                      className="rounded p-0.5 text-neutral-400 transition-all hover:text-navy disabled:opacity-20"
                      title="위로"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMove(s.id, "down")}
                      disabled={isPending || staffList.indexOf(s) === staffList.length - 1}
                      className="rounded p-0.5 text-neutral-400 transition-all hover:text-navy disabled:opacity-20"
                      title="아래로"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => setEditingId(s.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-navy transition-all hover:bg-navy/5 active:scale-95"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={isPending}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ),
        )}
      </div>

      {editMode && (
        <div className="mt-6">
          {showAdd ? (
            <StaffForm onClose={() => setShowAdd(false)} />
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full rounded-2xl border-2 border-dashed border-neutral-200 py-4 text-sm font-medium text-neutral-400 transition-all hover:border-navy hover:text-navy active:scale-[0.98]"
            >
              + 새 교역자 추가
            </button>
          )}
        </div>
      )}
    </>
  );
}
