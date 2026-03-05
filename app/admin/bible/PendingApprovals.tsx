"use client";

import { useTransition, useOptimistic } from "react";
import { approveGroup, rejectGroup } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  dakobang: "다코방",
  family: "가족",
  free: "자유",
};

interface PendingGroup {
  id: string;
  name: string;
  type: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdBy: string | null;
  createdAt: string;
}

export default function PendingApprovals({ groups }: { groups: PendingGroup[] }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticGroups, setOptimisticGroups] = useOptimistic(
    groups,
    (state, removedId: string) => state.filter((g) => g.id !== removedId),
  );

  function handleApprove(groupId: string) {
    startTransition(async () => {
      setOptimisticGroups(groupId);
      await approveGroup(groupId);
    });
  }

  function handleReject(groupId: string) {
    if (!confirm("정말 거절하시겠습니까?")) return;
    startTransition(async () => {
      setOptimisticGroups(groupId);
      await rejectGroup(groupId);
    });
  }

  if (optimisticGroups.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-neutral-800">승인 대기</h3>
      <p className="mt-0.5 text-sm text-neutral-400">
        사용자가 요청한 함께읽기 그룹입니다
      </p>

      <div className="mt-4 rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
              <th className="px-4 py-2.5 font-medium">이름</th>
              <th className="px-4 py-2.5 font-medium">타입</th>
              <th className="px-4 py-2.5 font-medium">신청자</th>
              <th className="px-4 py-2.5 font-medium">기간</th>
              <th className="px-4 py-2.5 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {optimisticGroups.map((g) => (
              <tr key={g.id} className="border-b border-neutral-50 last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-neutral-700">
                  {g.name}
                  {g.description && (
                    <span className="ml-1.5 text-xs text-neutral-400">{g.description}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-neutral-500">
                  {TYPE_LABEL[g.type] ?? g.type}
                </td>
                <td className="px-4 py-2.5 text-neutral-500">
                  {g.createdBy ?? "-"}
                </td>
                <td className="px-4 py-2.5 text-neutral-500">
                  {g.startDate && g.endDate
                    ? `${g.startDate.slice(0, 7).replace("-", ".")} ~ ${g.endDate.slice(0, 7).replace("-", ".")}`
                    : "-"
                  }
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleApprove(g.id)}
                      className="rounded-lg bg-navy px-3 py-1 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleReject(g.id)}
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-400 transition-all hover:bg-red-50 disabled:opacity-50"
                    >
                      거절
                    </button>
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
