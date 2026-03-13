"use client";

import { useState, useEffect } from "react";
import { getFolderSummaries } from "./actions";
import type { FolderSummary } from "./actions";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

export default function R2Summary() {
  const [summaries, setSummaries] = useState<FolderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFolderSummaries().then((data) => {
      setSummaries(data);
      setLoading(false);
    });
  }, []);

  const totalFiles = summaries.reduce((a, s) => a + s.fileCount, 0);
  const totalSize = summaries.reduce((a, s) => a + s.totalSize, 0);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-neutral-400">
        폴더 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div>
      {/* 전체 요약 */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 rounded-xl bg-white px-5 py-4 shadow-sm">
          <p className="text-xs text-neutral-400">전체 파일 수</p>
          <p className="mt-1 text-2xl font-bold text-navy">{totalFiles.toLocaleString()}</p>
        </div>
        <div className="flex-1 rounded-xl bg-white px-5 py-4 shadow-sm">
          <p className="text-xs text-neutral-400">전체 용량</p>
          <p className="mt-1 text-2xl font-bold text-navy">{formatSize(totalSize)}</p>
        </div>
        <div className="flex-1 rounded-xl bg-white px-5 py-4 shadow-sm">
          <p className="text-xs text-neutral-400">폴더 수</p>
          <p className="mt-1 text-2xl font-bold text-navy">{summaries.length}</p>
        </div>
      </div>

      {/* 폴더별 테이블 */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-xs text-neutral-400">
              <th className="px-5 py-3 text-left font-medium">폴더</th>
              <th className="px-5 py-3 text-right font-medium">파일 수</th>
              <th className="px-5 py-3 text-right font-medium">용량</th>
              <th className="px-5 py-3 text-right font-medium">비율</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.folder} className="border-b border-neutral-50 transition hover:bg-neutral-50">
                <td className="px-5 py-3 font-medium text-navy">{s.folder}/</td>
                <td className="px-5 py-3 text-right text-neutral-600">
                  {s.fileCount.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right text-neutral-600">
                  {formatSize(s.totalSize)}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-navy"
                        style={{ width: `${totalSize > 0 ? (s.totalSize / totalSize) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-400">
                      {totalSize > 0 ? ((s.totalSize / totalSize) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
