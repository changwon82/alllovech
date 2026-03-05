"use client";

import { useTransition, useOptimistic } from "react";
import { approveGroup, rejectGroup } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  dakobang: "다코방",
  family: "가족",
  free: "자유",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "승인 대기",
    className: "bg-accent/15 text-accent",
  },
  approved: {
    label: "승인됨",
    className: "bg-green-50 text-green-600",
  },
  rejected: {
    label: "거절됨",
    className: "bg-red-50 text-red-500",
  },
};

interface GroupRequest {
  id: string;
  name: string;
  type: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  startDate: string | null;
  endDate: string | null;
  createdBy: string | null;
  createdAt: string;
}

export default function GroupRequests({ groups }: { groups: GroupRequest[] }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticGroups, setOptimisticGroups] = useOptimistic(
    groups,
    (state, update: { id: string; status: "approved" | "rejected" }) =>
      state.map((g) => (g.id === update.id ? { ...g, status: update.status } : g)),
  );

  function handleApprove(groupId: string) {
    startTransition(async () => {
      setOptimisticGroups({ id: groupId, status: "approved" });
      await approveGroup(groupId);
    });
  }

  function handleReject(groupId: string) {
    if (!confirm("정말 거절하시겠습니까?")) return;
    startTransition(async () => {
      setOptimisticGroups({ id: groupId, status: "rejected" });
      await rejectGroup(groupId);
    });
  }

  // pending 그룹을 상단에 정렬
  const sorted = [...optimisticGroups].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return 0;
  });

  if (sorted.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-neutral-800">함께읽기 요청 내역</h3>
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
              <th className="px-4 py-2.5 font-medium">상태</th>
              <th className="px-4 py-2.5 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((g) => {
              const badge = STATUS_BADGE[g.status] ?? STATUS_BADGE.pending;
              return (
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
                  <td className="px-4 py-2.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {g.status === "pending" ? (
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
                    ) : (
                      <span className="text-xs text-neutral-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
