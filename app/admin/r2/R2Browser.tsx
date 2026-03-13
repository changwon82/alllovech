"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { listFiles, deleteFile, uploadFile } from "./actions";
import ImageLightbox from "@/app/components/ui/ImageLightbox";

const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp"]);

function isImage(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTS.has(ext);
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function fileIcon(fileName: string) {
  if (/\.pdf$/i.test(fileName)) return "📄";
  if (/\.hwp$/i.test(fileName)) return "📝";
  if (/\.(zip|rar|7z)$/i.test(fileName)) return "📦";
  return "📎";
}

type R2Object = { key: string; size: number; lastModified: string };
type ViewMode = "list" | "gallery";

export default function R2Browser() {
  const [prefix, setPrefix] = useState("");
  const [objects, setObjects] = useState<R2Object[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (p: string, token?: string) => {
    setLoading(true);
    try {
      const result = await listFiles(p, token);
      if (token) {
        setObjects((prev) => [...prev, ...result.objects]);
      } else {
        setObjects(result.objects);
        setFolders(result.folders);
      }
      setNextToken(result.nextToken);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(prefix);
    setSelected(new Set());
  }, [prefix, load]);

  function navigate(folder: string) {
    setPrefix(folder);
  }

  function goUp() {
    const parts = prefix.replace(/\/$/, "").split("/");
    parts.pop();
    setPrefix(parts.length > 0 ? parts.join("/") + "/" : "");
  }

  const breadcrumbs = prefix
    ? prefix.replace(/\/$/, "").split("/").map((part, i, arr) => ({
        label: part,
        path: arr.slice(0, i + 1).join("/") + "/",
      }))
    : [];

  async function handleDelete(key: string) {
    if (!confirm(`삭제하시겠습니까?\n${key}`)) return;
    startTransition(async () => {
      const result = await deleteFile(key);
      if (result.error) {
        alert(result.error);
      } else {
        setObjects((prev) => prev.filter((o) => o.key !== key));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    });
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size}개 파일을 삭제하시겠습니까?`)) return;
    startTransition(async () => {
      const keys = Array.from(selected);
      const results = await Promise.all(keys.map((k) => deleteFile(k)));
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        alert(`${failed.length}개 삭제 실패`);
      }
      const deletedKeys = new Set(keys.filter((_, i) => !results[i].error));
      setObjects((prev) => prev.filter((o) => !deletedKeys.has(o.key)));
      setSelected(new Set());
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    startTransition(async () => {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        const folder = prefix.replace(/\/$/, "");
        const result = await uploadFile(fd, folder);
        if (result.error) {
          alert(`업로드 실패: ${file.name}\n${result.error}`);
        }
      }
      load(prefix);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === objects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(objects.map((o) => o.key)));
    }
  }

  return (
    <div>
      {/* 상단 바 */}
      <div className="flex items-center justify-between rounded-t-xl bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setPrefix("")}
            className="font-medium text-navy hover:underline"
          >
            R2
          </button>
          {breadcrumbs.map((bc) => (
            <span key={bc.path} className="flex items-center gap-1">
              <span className="text-neutral-300">/</span>
              <button
                onClick={() => navigate(bc.path)}
                className="font-medium text-navy hover:underline"
              >
                {bc.label}
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* 보기 모드 토글 */}
          <div className="flex overflow-hidden rounded-lg border border-neutral-200">
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1.5 transition ${viewMode === "list" ? "bg-navy text-white" : "bg-white text-neutral-400 hover:text-neutral-600"}`}
              title="리스트"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("gallery")}
              className={`px-2.5 py-1.5 transition ${viewMode === "gallery" ? "bg-navy text-white" : "bg-white text-neutral-400 hover:text-neutral-600"}`}
              title="갤러리"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </button>
          </div>

          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {selected.size}개 삭제
            </button>
          )}
          <label className="cursor-pointer rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110">
            업로드
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="rounded-b-xl bg-white shadow-sm">
        {/* 폴더 + 상위이동 (공통) */}
        {(prefix || folders.length > 0) && (
          <div className={viewMode === "gallery" ? "flex flex-wrap gap-3 border-b border-neutral-100 px-4 py-3" : ""}>
            {/* 상위 폴더 */}
            {prefix && viewMode === "list" && (
              <div
                onClick={goUp}
                className="flex cursor-pointer items-center gap-3 border-b border-neutral-50 px-4 py-2.5 text-sm transition hover:bg-neutral-50"
              >
                <span className="w-3.5" />
                <span className="flex h-10 w-16 shrink-0 items-center justify-center text-lg">⬆️</span>
                <span className="text-neutral-500">..</span>
              </div>
            )}
            {prefix && viewMode === "gallery" && (
              <div
                onClick={goUp}
                className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl bg-neutral-50 transition hover:bg-neutral-100"
              >
                <span className="text-lg">⬆️</span>
                <span className="mt-0.5 text-[10px] text-neutral-400">..</span>
              </div>
            )}

            {/* 폴더 */}
            {viewMode === "list" && folders.map((folder) => (
              <div
                key={folder}
                onClick={() => navigate(folder)}
                className="flex cursor-pointer items-center gap-3 border-b border-neutral-50 px-4 py-2.5 text-sm transition hover:bg-neutral-50"
              >
                <span className="w-3.5" />
                <span className="flex h-10 w-16 shrink-0 items-center justify-center text-2xl">📁</span>
                <span className="flex-1 font-medium text-navy">
                  {folder.replace(prefix, "").replace(/\/$/, "")}
                </span>
              </div>
            ))}
            {viewMode === "gallery" && folders.map((folder) => (
              <div
                key={folder}
                onClick={() => navigate(folder)}
                className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl bg-neutral-50 transition hover:bg-neutral-100"
              >
                <span className="text-2xl">📁</span>
                <span className="mt-0.5 max-w-full truncate px-1 text-[10px] font-medium text-navy">
                  {folder.replace(prefix, "").replace(/\/$/, "")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ===== 리스트 뷰 ===== */}
        {viewMode === "list" && (
          <>
            {/* 헤더 */}
            <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-2 text-xs font-medium text-neutral-400">
              <input
                type="checkbox"
                checked={objects.length > 0 && selected.size === objects.length}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 rounded"
              />
              <span className="w-16 shrink-0 text-center">미리보기</span>
              <span className="flex-1">파일명</span>
              <span className="w-20 text-right">크기</span>
              <span className="w-28 text-right">수정일</span>
              <span className="w-16 text-center">작업</span>
            </div>

            {objects.map((obj) => {
              const fileName = obj.key.split("/").pop() || obj.key;
              const imgUrl = `${R2_PUBLIC}/${obj.key}`;
              const isImg = isImage(obj.key);

              return (
                <div
                  key={obj.key}
                  className={`flex items-center gap-3 border-b border-neutral-50 px-4 py-2 text-sm transition hover:bg-neutral-50 ${
                    selected.has(obj.key) ? "bg-blue-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(obj.key)}
                    onChange={() => toggleSelect(obj.key)}
                    className="h-3.5 w-3.5 rounded"
                  />
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
                      <span className="text-lg">{fileIcon(fileName)}</span>
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-neutral-700" title={obj.key}>
                    {fileName}
                  </span>
                  <span className="w-20 shrink-0 text-right text-xs text-neutral-400">
                    {formatSize(obj.size)}
                  </span>
                  <span className="w-28 shrink-0 text-right text-xs text-neutral-400">
                    {obj.lastModified ? new Date(obj.lastModified).toLocaleDateString("ko-KR") : "-"}
                  </span>
                  <div className="flex w-16 shrink-0 justify-center gap-1">
                    {isImg && (
                      <button
                        onClick={() => setLightboxSrc(imgUrl)}
                        className="rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                        title="미리보기"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(obj.key)}
                      disabled={isPending}
                      className="rounded p-1 text-neutral-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      title="삭제"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ===== 갤러리 뷰 ===== */}
        {viewMode === "gallery" && (
          <div className="p-4">
            {/* 전체 선택 */}
            {objects.length > 0 && (
              <label className="mb-3 inline-flex items-center gap-2 text-xs text-neutral-400">
                <input
                  type="checkbox"
                  checked={objects.length > 0 && selected.size === objects.length}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded"
                />
                전체 선택
              </label>
            )}

            <div className="grid grid-cols-4 gap-3 xl:grid-cols-6 2xl:grid-cols-8">
              {objects.map((obj) => {
                const fileName = obj.key.split("/").pop() || obj.key;
                const imgUrl = `${R2_PUBLIC}/${obj.key}`;
                const isImg = isImage(obj.key);
                const isSelected = selected.has(obj.key);

                return (
                  <div
                    key={obj.key}
                    className={`group relative overflow-hidden rounded-xl border-2 transition ${
                      isSelected ? "border-navy" : "border-transparent"
                    }`}
                  >
                    {/* 체크박스 */}
                    <div className="absolute left-2 top-2 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(obj.key)}
                        className="h-4 w-4 rounded border-white shadow"
                      />
                    </div>

                    {/* 이미지/아이콘 */}
                    <div
                      className="aspect-square cursor-pointer overflow-hidden bg-neutral-100"
                      onClick={() => isImg ? setLightboxSrc(imgUrl) : undefined}
                    >
                      {isImg ? (
                        <img
                          src={imgUrl}
                          alt={fileName}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-4xl">{fileIcon(fileName)}</span>
                        </div>
                      )}
                    </div>

                    {/* 하단 정보 바 */}
                    <div className="bg-white px-2 py-1.5">
                      <p className="truncate text-xs text-neutral-600" title={obj.key}>
                        {fileName}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400">{formatSize(obj.size)}</span>
                        <button
                          onClick={() => handleDelete(obj.key)}
                          disabled={isPending}
                          className="rounded p-0.5 text-neutral-300 transition hover:text-red-500 disabled:opacity-50"
                          title="삭제"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && objects.length === 0 && folders.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-neutral-400">
            {prefix ? "이 폴더에 파일이 없습니다" : "버킷이 비어 있습니다"}
          </div>
        )}

        {/* 더 보기 */}
        {nextToken && (
          <div className="px-4 py-3 text-center">
            <button
              onClick={() => load(prefix, nextToken)}
              disabled={loading}
              className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-50"
            >
              {loading ? "불러오는 중..." : "더 보기"}
            </button>
          </div>
        )}

        {/* 로딩 */}
        {loading && objects.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-neutral-400">
            불러오는 중...
          </div>
        )}
      </div>

      {/* 하단 요약 */}
      <div className="mt-3 text-xs text-neutral-400">
        파일 {objects.length}개
        {selected.size > 0 && ` · ${selected.size}개 선택됨`}
        {objects.length > 0 && ` · 합계 ${formatSize(objects.reduce((a, o) => a + o.size, 0))}`}
      </div>

      {/* 라이트박스 */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
