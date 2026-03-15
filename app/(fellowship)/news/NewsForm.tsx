"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState, useRef } from "react";
import { createNewsPost, updateNewsPost } from "./actions";
import RichEditor from "@/app/components/ui/RichEditor";
import { validateFileSize, fileSizeWarning } from "@/lib/validate-files";
import { todayKST } from "@/lib/date";

type ExistingFile = {
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
  existingFiles?: ExistingFile[];
};

export default function NewsForm({ mode, post, existingFiles = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [removedFiles, setRemovedFiles] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 남아있는 기존 파일
  const remainingFiles = existingFiles.filter(
    (f) => !removedFiles.includes(f.file_name),
  );

  function handleRemoveExisting(fileName: string) {
    setRemovedFiles((prev) => [...prev, fileName]);
  }

  function handleRemoveNew(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    // input 초기화
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const overFiles = validateFileSize(files, "ATTACHMENT");
      if (overFiles.length > 0) {
        alert(fileSizeWarning(overFiles, "ATTACHMENT"));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setNewFiles((prev) => [...prev, ...files]);
      // input 초기화해서 같은 파일 재선택 가능
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    // 기본 file input 대신 수동으로 관리하는 파일 추가
    formData.delete("files");
    for (const file of newFiles) {
      formData.append("files", file);
    }

    // 삭제할 파일 목록
    if (removedFiles.length > 0) {
      formData.set("removed_files", JSON.stringify(removedFiles));
    }

    startTransition(async () => {
      const action = mode === "create" ? createNewsPost : updateNewsPost;
      const result = await action(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        router.push(`/news/${result.id}`);
        router.refresh();
      }
    });
  }

  const today = todayKST();
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

      {/* 본문 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          내용
        </label>
        <RichEditor
          name="content"
          defaultValue={post?.content || ""}
          placeholder="내용을 입력하세요"
          rows={12}
          folder="news"
        />
      </div>

      {/* 기존 첨부파일 (수정 모드) */}
      {remainingFiles.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            기존 첨부파일
          </label>
          <div className="space-y-2">
            {remainingFiles.map((file) => (
              <div
                key={file.file_name}
                className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5 text-sm"
              >
                <span className="min-w-0 truncate text-neutral-600">
                  {file.original_name || file.file_name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveExisting(file.file_name)}
                  className="ml-3 shrink-0 text-xs text-red-400 transition hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 새 파일 목록 */}
      {newFiles.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            새 첨부파일
          </label>
          <div className="space-y-2">
            {newFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5 text-sm"
              >
                <span className="min-w-0 truncate text-neutral-600">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveNew(i)}
                  className="ml-3 shrink-0 text-xs text-red-400 transition hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 파일 업로드 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          파일 첨부
        </label>
        <input
          ref={fileInputRef}
          type="file"
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
