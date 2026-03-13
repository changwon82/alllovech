"use client";

import { useState, useTransition, useRef } from "react";
import RichEditor from "./ui/RichEditor";
import { savePage } from "./editable-page-actions";

export default function EditablePage({
  slug,
  initialContent,
  isAdmin,
  fallback,
}: {
  slug: string;
  initialContent: string | null;
  isAdmin: boolean;
  fallback?: React.ReactNode;
}) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [editorDefault, setEditorDefault] = useState("");
  const [isSaving, startSaving] = useTransition();
  const fallbackRef = useRef<HTMLDivElement>(null);

  const hasContent = content !== null && content.trim() !== "";

  function handleEdit() {
    if (hasContent) {
      setEditorDefault(content);
    } else if (fallbackRef.current) {
      // fallback의 렌더된 HTML을 에디터 초기값으로 사용
      setEditorDefault(fallbackRef.current.innerHTML);
    }
    setIsEditing(true);
  }

  if (isEditing) {
    return (
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newContent = formData.get("content") as string;
            startSaving(async () => {
              const result = await savePage(slug, newContent);
              if ("content" in result) {
                setContent(result.content ?? null);
                setIsEditing(false);
              } else if ("error" in result) {
                alert(result.error);
              }
            });
          }}
        >
          <RichEditor
            key={editorDefault.slice(0, 50)}
            name="content"
            defaultValue={editorDefault}
            rows={20}
            folder="pages"
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-200"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            페이지 수정
          </button>
        </div>
      )}
      {hasContent ? (
        <div
          className="prose prose-neutral max-w-none text-[15px] leading-relaxed md:text-base [&_img]:rounded-lg [&_img]:max-w-full"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div ref={fallbackRef}>{fallback}</div>
      )}
    </div>
  );
}
