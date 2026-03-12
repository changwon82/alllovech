"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSermon, updateSermon } from "./actions";

type Sermon = {
  id: number;
  title: string;
  preacher: string;
  sermon_date: string;
  scripture: string | null;
  category: string;
  youtube_url: string | null;
};

export default function SermonForm({
  sermon,
  categories,
  onClose,
}: {
  sermon?: Sermon;
  categories: string[];
  onClose: () => void;
}) {
  const isEdit = !!sermon;
  const [title, setTitle] = useState(sermon?.title || "");
  const [preacher, setPreacher] = useState(sermon?.preacher || "");
  const [sermonDate, setSermonDate] = useState(sermon?.sermon_date || "");
  const [scripture, setScripture] = useState(sermon?.scripture || "");
  const [category, setCategory] = useState(sermon?.category || categories[0] || "");
  const [youtubeUrl, setYoutubeUrl] = useState(sermon?.youtube_url || "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !preacher.trim() || !sermonDate || !category) {
      setError("제목, 설교자, 날짜, 카테고리는 필수입니다.");
      return;
    }

    const input = {
      title: title.trim(),
      preacher: preacher.trim(),
      sermon_date: sermonDate,
      scripture: scripture.trim(),
      category,
      youtube_url: youtubeUrl.trim(),
    };

    const result = isEdit
      ? await updateSermon(sermon!.id, input)
      : await createSermon(input);

    if (result.error) {
      setError(result.error);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
    onClose();
  }

  // 유튜브 URL에서 썸네일 추출
  function getPreview(url: string): string | null {
    if (!url) return null;
    const m =
      url.match(/embed\/([a-zA-Z0-9_-]+)/) ||
      url.match(/[?&]v=([a-zA-Z0-9_-]+)/) ||
      url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
  }

  const preview = getPreview(youtubeUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-800">
            {isEdit ? "설교 수정" : "새 영상 등록"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 유튜브 URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-600">
              유튜브 URL
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
            />
            {preview && (
              <img
                src={preview}
                alt="미리보기"
                className="mt-2 h-24 rounded-lg object-cover"
              />
            )}
          </div>

          {/* 제목 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-600">
              제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
            />
          </div>

          {/* 설교자 + 날짜 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-600">
                설교자 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={preacher}
                onChange={(e) => setPreacher(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-600">
                설교일 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={sermonDate}
                onChange={(e) => setSermonDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
              />
            </div>
          </div>

          {/* 본문 + 카테고리 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-600">
                성경 본문
              </label>
              <input
                type="text"
                value={scripture}
                onChange={(e) => setScripture(e.target.value)}
                placeholder="창세기 1:1-3"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-600">
                카테고리 <span className="text-red-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isPending ? "저장 중..." : isEdit ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
