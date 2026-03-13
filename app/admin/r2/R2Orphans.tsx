"use client";

import { useState, useTransition } from "react";
import { findOrphanFiles, deleteFile, moveOrphansToLostFolder } from "./actions";
import type { OrphanResult } from "./actions";
import ImageLightbox from "@/app/components/ui/ImageLightbox";

const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp"]);

function isImage(key: string) {
  return IMAGE_EXTS.has(key.split(".").pop()?.toLowerCase() || "");
}

export default function R2Orphans() {
  const [results, setResults] = useState<OrphanResult[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moveProgress, setMoveProgress] = useState("");

  function handleScan() {
    startTransition(async () => {
      const data = await findOrphanFiles();
      setResults(data);
      setSelected(new Set());
    });
  }

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAllInFolder(keys: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = keys.every((k) => next.has(k));
      if (allSelected) {
        keys.forEach((k) => next.delete(k));
      } else {
        keys.forEach((k) => next.add(k));
      }
      return next;
    });
  }

  function selectAll() {
    if (!results) return;
    const allKeys = results.flatMap((r) => r.orphanKeys);
    setSelected((prev) => {
      const allSelected = allKeys.every((k) => prev.has(k));
      return allSelected ? new Set() : new Set(allKeys);
    });
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size}개 고아 파일을 삭제하시겠습니까?\n\nDB에 연결되지 않은 파일만 선택되었습니다.`)) return;

    setDeleting(true);
    const keys = Array.from(selected);
    let failed = 0;

    for (let i = 0; i < keys.length; i += 10) {
      const batch = keys.slice(i, i + 10);
      const results = await Promise.all(batch.map((k) => deleteFile(k)));
      failed += results.filter((r) => r.error).length;
    }

    if (failed > 0) {
      alert(`${failed}개 삭제 실패`);
    }

    const deletedKeys = new Set(keys);
    setResults((prev) =>
      prev?.map((r) => ({
        ...r,
        orphanKeys: r.orphanKeys.filter((k) => !deletedKeys.has(k)),
        totalOrphans: r.orphanKeys.filter((k) => !deletedKeys.has(k)).length,
      })) ?? null,
    );
    setSelected(new Set());
    setDeleting(false);
  }

  async function handleMoveToLostFolder() {
    if (!results) return;
    const allOrphanKeys = results.flatMap((r) => r.orphanKeys);
    if (allOrphanKeys.length === 0) return;

    if (!confirm(`${allOrphanKeys.length}개 고아 파일을 lost_folder/로 이동하시겠습니까?\n\n삭제가 아닌 이동이므로 나중에 복구할 수 있습니다.`)) return;

    setMoving(true);
    setMoveProgress("이동 준비 중...");

    try {
      const moveResults = await moveOrphansToLostFolder(allOrphanKeys);

      const totalMoved = moveResults.reduce((a, r) => a + r.moved, 0);
      const totalFailed = moveResults.reduce((a, r) => a + r.failed, 0);

      if (totalFailed > 0) {
        alert(`이동 완료: ${totalMoved}개 성공, ${totalFailed}개 실패`);
      } else {
        setMoveProgress(`${totalMoved}개 파일 이동 완료!`);
      }

      // 이동된 파일 제거
      const movedKeys = new Set(allOrphanKeys);
      setResults((prev) =>
        prev?.map((r) => ({
          ...r,
          orphanKeys: r.orphanKeys.filter((k) => !movedKeys.has(k)),
          totalOrphans: r.orphanKeys.filter((k) => !movedKeys.has(k)).length,
        })) ?? null,
      );
      setSelected(new Set());
    } catch {
      alert("이동 중 오류가 발생했습니다");
    }

    setMoving(false);
    setTimeout(() => setMoveProgress(""), 3000);
  }

  const totalOrphans = results?.reduce((a, r) => a + r.totalOrphans, 0) ?? 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-600">
            DB에 연결되지 않은 R2 파일을 찾습니다.
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">
            게시물 content, 첨부파일 테이블과 비교하여 어디에서도 참조되지 않는 파일을 탐지합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? "삭제 중..." : `${selected.size}개 삭제`}
            </button>
          )}
          <button
            onClick={handleScan}
            disabled={isPending}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {isPending ? "검사 중..." : "검사 시작"}
          </button>
        </div>
      </div>

      {isPending && !results && (
        <div className="rounded-xl bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-neutral-400">R2와 DB를 비교하는 중...</p>
          <p className="mt-1 text-xs text-neutral-300">파일이 많으면 시간이 걸릴 수 있습니다</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {/* 요약 + 전체 이동 버튼 */}
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl bg-white px-5 py-4 shadow-sm">
              <p className="text-xs text-neutral-400">검사 폴더</p>
              <p className="mt-1 text-xl font-bold text-navy">{results.length}</p>
            </div>
            <div className={`flex-1 rounded-xl px-5 py-4 shadow-sm ${totalOrphans > 0 ? "bg-red-50" : "bg-white"}`}>
              <p className="text-xs text-neutral-400">고아 파일</p>
              <p className={`mt-1 text-xl font-bold ${totalOrphans > 0 ? "text-red-500" : "text-green-600"}`}>
                {totalOrphans === 0 ? "없음" : `${totalOrphans}개`}
              </p>
            </div>
          </div>

          {/* 전체 작업 버튼 */}
          {totalOrphans > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleMoveToLostFolder}
                disabled={moving}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {moving ? "이동 중..." : `전체 ${totalOrphans}개 → lost_folder/ 이동`}
              </button>
              <button
                onClick={selectAll}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-500 transition hover:bg-neutral-50"
              >
                {results.flatMap((r) => r.orphanKeys).every((k) => selected.has(k))
                  ? "전체 선택 해제"
                  : "전체 선택"}
              </button>
              {moveProgress && (
                <span className="text-sm font-medium text-green-600">{moveProgress}</span>
              )}
            </div>
          )}

          {/* 폴더별 결과 */}
          {results.map((r) => (
            <div key={r.folder} className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-navy">{r.folder}/</span>
                  <span className="text-xs text-neutral-400">
                    전체 {r.totalFiles}개
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {r.totalOrphans > 0 ? (
                    <>
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                        고아 {r.totalOrphans}개
                      </span>
                      <button
                        onClick={() => selectAllInFolder(r.orphanKeys)}
                        className="text-xs text-neutral-400 hover:text-neutral-600"
                      >
                        {r.orphanKeys.every((k) => selected.has(k)) ? "선택 해제" : "전체 선택"}
                      </button>
                    </>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-600">
                      정상
                    </span>
                  )}
                </div>
              </div>

              {/* 고아 파일 목록 */}
              {r.orphanKeys.length > 0 && (
                <div className="max-h-64 overflow-y-auto">
                  {r.orphanKeys.map((key) => {
                    const fileName = key.split("/").pop() || key;
                    const imgUrl = `${R2_PUBLIC}/${key}`;
                    const isImg = isImage(key);

                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 border-b border-neutral-50 px-5 py-1.5 text-sm transition hover:bg-neutral-50 ${
                          selected.has(key) ? "bg-red-50" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(key)}
                          onChange={() => toggleSelect(key)}
                          className="h-3.5 w-3.5 rounded"
                        />
                        <div className="flex h-8 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-100">
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
                            <span className="text-xs">📎</span>
                          )}
                        </div>
                        <span className="min-w-0 flex-1 truncate text-xs text-neutral-500" title={key}>
                          {fileName}
                        </span>
                        <button
                          onClick={() => {
                            if (!confirm(`삭제: ${key}`)) return;
                            deleteFile(key).then(() => {
                              setResults((prev) =>
                                prev?.map((res) =>
                                  res.folder === r.folder
                                    ? {
                                        ...res,
                                        orphanKeys: res.orphanKeys.filter((k) => k !== key),
                                        totalOrphans: res.totalOrphans - 1,
                                      }
                                    : res,
                                ) ?? null,
                              );
                              setSelected((prev) => { const n = new Set(prev); n.delete(key); return n; });
                            });
                          }}
                          className="shrink-0 rounded p-1 text-neutral-300 transition hover:text-red-500"
                          title="삭제"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
