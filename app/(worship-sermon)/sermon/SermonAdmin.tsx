"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SermonForm from "./SermonForm";
import { deleteSermon } from "./actions";

type Sermon = {
  id: number;
  title: string;
  preacher: string;
  sermon_date: string;
  scripture: string | null;
  category: string;
  youtube_url: string | null;
};

/** 상단 "새 영상 등록" 버튼 */
export function AddSermonButton({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        새 영상 등록
      </button>
      {open && (
        <SermonForm categories={categories} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

/** 각 카드의 수정/삭제 오버레이 */
export function SermonCardAdmin({
  sermon,
  categories,
}: {
  sermon: Sermon;
  categories: string[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`"${sermon.title}" 을(를) 삭제하시겠습니까?`)) return;
    const result = await deleteSermon(sermon.id);
    if (result.error) {
      alert(result.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditOpen(true);
          }}
          disabled={isPending}
          className="rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-neutral-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-navy"
        >
          수정
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDelete();
          }}
          disabled={isPending}
          className="rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-neutral-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-red-500"
        >
          삭제
        </button>
      </div>
      {editOpen && (
        <SermonForm
          sermon={sermon}
          categories={categories}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
