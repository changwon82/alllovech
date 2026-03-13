"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState, useRef } from "react";
import { createJuboPost, updateJuboPost } from "./actions";
import RichEditor from "@/app/components/ui/RichEditor";

const R2_JUBO = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/jubo";

type ExistingImage = {
  file_name: string;
  original_name: string;
};

type Props = {
  mode: "create" | "edit";
  post?: {
    id: number;
    title: string;
    content: string;
    post_date: string;
    author: string;
  };
  existingImages?: ExistingImage[];
};

export default function JuboForm({ mode, post, existingImages = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 남아있는 기존 이미지
  const remainingImages = existingImages.filter(
    (img) => !removedImages.includes(img.file_name),
  );

  function handleRemoveExisting(fileName: string) {
    setRemovedImages((prev) => [...prev, fileName]);
  }

  function handleRemoveNew(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      // 이전 프리뷰 URL 해제
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...files]);
      // 프리뷰 URL 생성
      const newPreviews = files.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...newPreviews]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    // 기본 file input 대신 수동으로 관리하는 파일 추가
    formData.delete("images");
    for (const file of newFiles) {
      formData.append("images", file);
    }

    // 삭제할 이미지 목록
    if (removedImages.length > 0) {
      formData.set("removed_images", JSON.stringify(removedImages));
    }

    startTransition(async () => {
      const action = mode === "create" ? createJuboPost : updateJuboPost;
      const result = await action(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        router.push(`/jubo/${result.id}`);
        router.refresh();
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const dateValue = post?.post_date ? post.post_date.slice(0, 10) : today;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 수정 시 ID 전달 */}
      {mode === "edit" && post && (
        <input type="hidden" name="id" value={post.id} />
      )}

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 제목 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          제목 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          defaultValue={post?.title || ""}
          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy"
          placeholder="제목을 입력하세요"
        />
      </div>

      {/* 날짜 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          날짜
        </label>
        <input
          type="date"
          name="post_date"
          defaultValue={dateValue}
          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy"
        />
      </div>

      {/* 작성자 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          작성자
        </label>
        <input
          type="text"
          name="author"
          defaultValue={post?.author || "다애교회"}
          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy"
        />
      </div>

      {/* 내용 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          내용
        </label>
        <RichEditor
          name="content"
          defaultValue={post?.content || ""}
          placeholder="내용을 입력하세요 (선택사항)"
          rows={6}
          folder="jubo"
        />
      </div>

      {/* 기존 이미지 (수정 모드) */}
      {remainingImages.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            기존 이미지
          </label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {remainingImages.map((img) => (
              <div key={img.file_name} className="group relative">
                <div className="aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100">
                  <img
                    src={`${R2_JUBO}/${img.file_name}`}
                    alt={img.original_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExisting(img.file_name)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow transition hover:bg-red-600"
                >
                  X
                </button>
                <p className="mt-1 truncate text-xs text-neutral-400">
                  {img.original_name || img.file_name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 새 이미지 프리뷰 */}
      {previews.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            새 이미지
          </label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {previews.map((url, i) => (
              <div key={`${newFiles[i]?.name}-${i}`} className="group relative">
                <div className="aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100">
                  <img
                    src={url}
                    alt={newFiles[i]?.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveNew(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow transition hover:bg-red-600"
                >
                  X
                </button>
                <p className="mt-1 truncate text-xs text-neutral-400">
                  {newFiles[i]?.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이미지 업로드 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          이미지 첨부
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 file:transition hover:file:bg-neutral-200"
        />
      </div>

      {/* 버튼 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {isPending
            ? "저장 중..."
            : mode === "create"
              ? "등록"
              : "수정"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-200 active:scale-95"
        >
          취소
        </button>
      </div>
    </form>
  );
}
