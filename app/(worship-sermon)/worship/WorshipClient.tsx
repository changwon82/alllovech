"use client";

import { useState, useTransition } from "react";
import {
  createService,
  updateService,
  deleteService,
  reorderService,
} from "./actions";

type Service = {
  id: string;
  name: string;
  sub: string | null;
  times: string[];
  location: string;
  bg: boolean;
  is_split: boolean;
  parent_id: string | null;
  sort_order: number;
};

/* ── 수정 토글 아이콘 ── */
export function EditToggle({
  isAdmin,
  editMode,
  setEditMode,
}: {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
}) {
  if (!isAdmin) return null;
  return editMode ? (
    <button
      onClick={() => setEditMode(false)}
      className="rounded-full p-1.5 text-navy transition-all hover:bg-navy/5 active:scale-95"
      title="수정 완료"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    </button>
  ) : (
    <button
      onClick={() => setEditMode(true)}
      className="rounded-full p-1.5 text-neutral-400 transition-all hover:text-navy active:scale-95"
      title="수정"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
      </svg>
    </button>
  );
}

/* ── 폼 (추가/수정 공용) ── */
function ServiceForm({
  service,
  onClose,
}: {
  service?: Service;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = service
        ? await updateService(service.id, fd)
        : await createService(fd);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-3">
        <input
          name="name"
          placeholder="예배명 (예: 주일예배)"
          defaultValue={service?.name ?? ""}
          required
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          name="sub"
          placeholder="부제 (선택, 예: (중등부, 고등부))"
          defaultValue={service?.sub ?? ""}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <textarea
          name="times"
          placeholder={"시간 (줄바꿈으로 구분)\n예:\n1부 주일 오전 9시\n2부 주일 오전 11시"}
          defaultValue={service?.times.join("\n") ?? ""}
          required
          rows={3}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          name="location"
          placeholder="장소 (예: 대예배실(지하 2층))"
          defaultValue={service?.location ?? ""}
          required
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
      </div>
      <label className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
        <input
          type="checkbox"
          name="bg"
          defaultChecked={service?.bg ?? false}
          className="rounded"
        />
        배경색 (회색)
      </label>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "저장중..." : service ? "수정" : "추가"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition-all hover:bg-neutral-50 active:scale-95"
        >
          취소
        </button>
      </div>
    </form>
  );
}

/* ── 메인 컴포넌트 ── */
export default function WorshipClient({
  services,
  editMode,
}: {
  services: Service[];
  editMode: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 부모 행만 (parent_id가 null)
  const parents = services
    .filter((s) => !s.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  function getChildren(parentId: string) {
    return services
      .filter((s) => s.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`${name}을(를) 삭제하시겠습니까?`)) return;
    startTransition(async () => {
      const result = await deleteService(id);
      if (result.error) alert(result.error);
    });
  }

  function handleMove(id: string, direction: "up" | "down") {
    startTransition(async () => {
      const result = await reorderService(id, direction);
      if (result.error) alert(result.error);
    });
  }

  const dividerClass =
    "relative px-3 py-3 md:px-6 md:py-5 text-center before:absolute before:left-0 before:top-3 before:bottom-3 before:w-px before:bg-neutral-200";

  return (
    <>
      <div className="overflow-hidden border border-neutral-200">
        {parents.map((s, idx) => {
          if (editingId === s.id) {
            return (
              <div key={s.id} className="border-b border-neutral-200 p-4 last:border-b-0">
                <ServiceForm service={s} onClose={() => setEditingId(null)} />
              </div>
            );
          }

          const children = s.is_split ? getChildren(s.id) : [];

          return (
            <div
              key={s.id}
              className={`border-b border-neutral-200 last:border-b-0 ${
                s.bg ? "bg-neutral-50" : ""
              }`}
            >
              {s.is_split ? (
                /* split 행 (새벽기도회) */
                <div>
                  {children.map((block, i) => (
                    <div
                      key={block.id}
                      className={`grid grid-cols-[7.5rem_1fr] md:grid-cols-[1fr_2fr_1fr] items-center ${
                        i > 0 ? "border-t border-neutral-100" : ""
                      }`}
                    >
                      {i === 0 ? (
                        <div className="self-center whitespace-nowrap px-3 py-3 md:px-6 md:py-5 text-left md:text-center">
                          <p className="text-sm font-bold text-neutral-700">{s.name}</p>
                          {s.sub && <p className="text-sm text-neutral-500">{s.sub}</p>}
                        </div>
                      ) : (
                        <div className="hidden md:block px-3 py-3 md:px-6 md:py-5" />
                      )}
                      <div className={`${dividerClass} ${i > 0 ? "col-span-full md:col-span-1 before:hidden md:before:block" : ""}`}>
                        {block.times.map((t) => (
                          <p key={t} className="text-sm text-neutral-600">{t}</p>
                        ))}
                      </div>
                      <div className={`${dividerClass} hidden md:block whitespace-nowrap text-sm text-neutral-600`}>
                        {block.location}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 일반 행 */
                <div className="grid grid-cols-[7.5rem_1fr] md:grid-cols-[1fr_2fr_1fr] items-center">
                  <div className="whitespace-nowrap px-3 py-3 md:px-6 md:py-5 text-left md:text-center">
                    <p className="text-sm font-bold text-neutral-700">{s.name}</p>
                    {s.sub && <p className="text-sm text-neutral-500">{s.sub}</p>}
                  </div>
                  <div className={dividerClass}>
                    {s.times.map((t) => (
                      <p key={t} className="text-sm text-neutral-600">{t}</p>
                    ))}
                  </div>
                  <div className={`${dividerClass} hidden md:block whitespace-nowrap text-sm text-neutral-600`}>
                    {s.location}
                  </div>
                </div>
              )}

              {/* 편집 버튼 */}
              {editMode && (
                <div className="flex items-center gap-2 border-t border-dashed border-neutral-200 px-4 py-2">
                  <button
                    onClick={() => handleMove(s.id, "up")}
                    disabled={isPending || idx === 0}
                    className="rounded p-1 text-neutral-400 transition hover:text-navy disabled:opacity-20"
                    title="위로"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMove(s.id, "down")}
                    disabled={isPending || idx === parents.length - 1}
                    className="rounded p-1 text-neutral-400 transition hover:text-navy disabled:opacity-20"
                    title="아래로"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingId(s.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-navy/5 active:scale-95"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={isPending}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 active:scale-95 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editMode && (
        <div className="mt-6">
          {showAdd ? (
            <ServiceForm onClose={() => setShowAdd(false)} />
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full rounded-2xl border-2 border-dashed border-neutral-200 py-4 text-sm font-medium text-neutral-400 transition-all hover:border-navy hover:text-navy active:scale-[0.98]"
            >
              + 새 예배 추가
            </button>
          )}
        </div>
      )}
    </>
  );
}
