"use client";

import { useState, useTransition } from "react";
import { searchFiles, deleteFile } from "./actions";
import ImageLightbox from "@/app/components/ui/ImageLightbox";

const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp"]);

function isImage(key: string) {
  return IMAGE_EXTS.has(key.split(".").pop()?.toLowerCase() || "");
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

type R2Object = { key: string; size: number; lastModified: string };

export default function R2Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<R2Object[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      const data = await searchFiles(query.trim());
      setResults(data);
      setSearched(true);
    });
  }

  function handleDelete(key: string) {
    if (!confirm(`삭제하시겠습니까?\n${key}`)) return;
    startTransition(async () => {
      const result = await deleteFile(key);
      if (result.error) {
        alert(result.error);
      } else {
        setResults((prev) => prev.filter((o) => o.key !== key));
      }
    });
  }

  return (
    <div>
      {/* 검색 바 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="파일명으로 검색 (예: inline, 504, webp...)"
          className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none transition focus:border-navy focus:ring-1 focus:ring-navy"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "검색 중..." : "검색"}
        </button>
      </form>

      {/* 결과 */}
      {searched && (
        <div className="mt-4">
          <p className="mb-3 text-xs text-neutral-400">
            {results.length === 200 ? "200개 이상" : `${results.length}개`} 결과
          </p>

          {results.length === 0 ? (
            <div className="rounded-xl bg-white py-12 text-center text-sm text-neutral-400 shadow-sm">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              {results.map((obj) => {
                const fileName = obj.key.split("/").pop() || obj.key;
                const imgUrl = `${R2_PUBLIC}/${obj.key}`;
                const isImg = isImage(obj.key);

                return (
                  <div
                    key={obj.key}
                    className="flex items-center gap-3 border-b border-neutral-50 px-4 py-2 text-sm transition hover:bg-neutral-50"
                  >
                    {/* 미리보기 */}
                    <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-100">
                      {isImg ? (
                        <img
                          src={imgUrl}
                          alt={fileName}
                          className="h-full w-full cursor-pointer object-cover"
                          loading="lazy"
                          onClick={() => setLightboxSrc(imgUrl)}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <span className="text-lg">📎</span>
                      )}
                    </div>
                    {/* 경로 */}
                    <span className="min-w-0 flex-1 truncate text-neutral-600" title={obj.key}>
                      <span className="text-neutral-400">{obj.key.replace(fileName, "")}</span>
                      <span className="font-medium text-neutral-700">{fileName}</span>
                    </span>
                    <span className="shrink-0 text-xs text-neutral-400">{formatSize(obj.size)}</span>
                    <button
                      onClick={() => handleDelete(obj.key)}
                      disabled={isPending}
                      className="shrink-0 rounded p-1 text-neutral-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      title="삭제"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
