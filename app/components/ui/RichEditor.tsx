"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { uploadEditorImage } from "./upload-image-action";

type Props = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  /** R2 업로드 폴더 (예: "gallery", "news", "jubo", "brothers") */
  folder?: string;
};

export default function RichEditor({
  name,
  defaultValue = "",
  placeholder = "내용을 입력하세요",
  rows = 12,
  folder = "editor",
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const syncValue = useCallback(() => {
    if (editorRef.current && hiddenRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  }, []);

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    syncValue();
  }, [syncValue]);

  // 이미지 업로드 후 에디터에 삽입
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      const result = await uploadEditorImage(fd);

      if (result.url && editorRef.current) {
        editorRef.current.focus();
        const img = `<br><img src="${result.url}" alt="${file.name}" style="max-width:100%;height:auto;margin:8px 0;border-radius:8px;" /><br>`;
        document.execCommand("insertHTML", false, img);
        syncValue();
      } else if (result.error) {
        alert(`이미지 업로드 실패: ${result.error}`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [syncValue]);

  // 초기 내용 설정 (한 번만)
  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 폼 제출 직전에 hidden input 동기화
  useEffect(() => {
    const form = hiddenRef.current?.closest("form");
    if (!form) return;
    const handler = () => syncValue();
    form.addEventListener("submit", handler, { capture: true });
    return () => form.removeEventListener("submit", handler, { capture: true });
  }, [syncValue]);

  const minH = rows * 24;

  return (
    <div className="rounded-xl border border-neutral-200 transition-within focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-100 px-2 py-1.5">
        <ToolBtn onClick={() => exec("bold")} title="굵게">
          <span className="font-bold">B</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="기울임">
          <span className="italic">I</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="밑줄">
          <span className="underline">U</span>
        </ToolBtn>
        <span className="mx-1 h-4 w-px bg-neutral-200" />
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="목록">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </ToolBtn>
        <ToolBtn
          onClick={() => {
            const url = prompt("링크 URL을 입력하세요:");
            if (url) exec("createLink", url);
          }}
          title="링크"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
          </svg>
        </ToolBtn>
        <span className="mx-1 h-4 w-px bg-neutral-200" />
        {/* 사진 삽입 */}
        <ToolBtn
          onClick={() => fileInputRef.current?.click()}
          title="사진 삽입"
        >
          {isUploading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          )}
        </ToolBtn>
        <span className="mx-1 h-4 w-px bg-neutral-200" />
        <ToolBtn onClick={() => exec("removeFormat")} title="서식 제거">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </ToolBtn>
      </div>

      {/* 업로드 중 표시 */}
      {isUploading && (
        <div className="border-b border-neutral-100 bg-blue-50 px-3 py-1.5 text-xs text-blue-600">
          사진 업로드 중...
        </div>
      )}

      {/* 에디터 영역 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncValue}
        onBlur={syncValue}
        className="prose prose-sm max-w-none px-4 py-3 text-sm leading-relaxed outline-none [&_img]:rounded-lg [&_img]:max-w-full"
        style={{ minHeight: `${minH}px` }}
        data-placeholder={placeholder}
      />

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* hidden input으로 form에 값 전달 */}
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        defaultValue={defaultValue}
      />
    </div>
  );
}

function ToolBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
    >
      {children}
    </button>
  );
}
