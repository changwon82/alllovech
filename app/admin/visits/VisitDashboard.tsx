"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/app/components/ui/StatCard";
import Badge from "@/app/components/ui/Badge";
import VisitForm from "./VisitForm";
import {
  type VisitRow,
  type VisitType,
  type VisitStatus,
  type CreateVisitInput,
  VISIT_TYPE_LABELS,
  VISIT_STATUS_LABELS,
  SUGGESTION_REASONS,
  createVisit,
  updateVisit,
  deleteVisit,
  completeVisit,
  generateSuggestions,
  scheduleSuggestion,
  dismissSuggestion,
  bulkScheduleSuggestions,
  bulkDismissSuggestions,
} from "./actions";

type Member = { id: string; name: string; phone: string | null; birth_date: string | null; gender: string | null };
type Tab = "list" | "suggestions" | "history";
type StatusFilter = "all" | "scheduled" | "completed" | "cancelled";

const STATUS_BADGE_VARIANT: Record<VisitStatus, "default" | "accent" | "navy"> = {
  suggested: "accent",
  scheduled: "navy",
  completed: "default",
  cancelled: "default",
  no_show: "default",
};

function formatDate(d: string | null) {
  if (!d) return "-";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function formatFullDate(d: string | null) {
  if (!d) return "-";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

interface Props {
  initialVisits: VisitRow[];
  members: Member[];
  stats: { scheduled: number; completed: number; followUp: number; suggested: number };
}

export default function VisitDashboard({ initialVisits, members, stats }: Props) {
  const router = useRouter();
  const [visits, setVisits] = useState(initialVisits);
  const [tab, setTab] = useState<Tab>("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<VisitType | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<VisitRow | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // 심방 목록 필터링 (제안 제외)
  const filteredVisits = visits.filter((v) => {
    if (v.status === "suggested") return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (typeFilter !== "all" && v.visit_type !== typeFilter) return false;
    return true;
  });

  // 자동 제안 목록
  const suggestions = visits.filter((v) => v.status === "suggested");

  // 교인별 이력
  const memberVisits = selectedMemberId
    ? visits.filter((v) => v.member_id === selectedMemberId && v.status !== "suggested")
    : [];

  // 이름으로 교인 검색
  const memberResults = memberSearch
    ? members.filter((m) => m.name.includes(memberSearch)).slice(0, 20)
    : [];

  // 심방자 이름 조회
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  function visitorNames(ids: string[]) {
    if (!ids || ids.length === 0) return "-";
    return ids.map((id) => memberMap.get(id) ?? "?").join(", ");
  }

  // CRUD 핸들러
  function handleCreate(data: CreateVisitInput) {
    startTransition(async () => {
      const result = await createVisit(data);
      if (result.data) {
        setVisits((prev) => [result.data as VisitRow, ...prev]);
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function handleUpdate(data: CreateVisitInput) {
    if (!editingVisit) return;
    startTransition(async () => {
      const result = await updateVisit(editingVisit.id, data);
      if (result.data) {
        setVisits((prev) => prev.map((v) => (v.id === editingVisit.id ? result.data as VisitRow : v)));
        setEditingVisit(null);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("이 심방 기록을 삭제하시겠습니까?")) return;
    setVisits((prev) => prev.filter((v) => v.id !== id));
    startTransition(async () => {
      await deleteVisit(id);
      router.refresh();
    });
  }

  function handleComplete(visit: VisitRow) {
    setVisits((prev) => prev.map((v) => (v.id === visit.id ? { ...v, status: "completed" as VisitStatus } : v)));
    startTransition(async () => {
      await completeVisit(visit.id);
      router.refresh();
    });
  }

  function handleCreateFollowUp(visit: VisitRow) {
    setEditingVisit(null);
    setShowForm(true);
    // VisitForm에 pre-fill할 수 없으므로 별도 state 대신 바로 생성
    startTransition(async () => {
      const result = await createVisit({
        member_id: visit.member_id,
        visitor_ids: visit.visitor_ids,
        visit_type: "follow_up",
        status: "scheduled",
        notes: `이전 심방(${formatDate(visit.visit_date)}) 후속`,
      });
      if (result.data) {
        setVisits((prev) => [result.data as VisitRow, ...prev]);
        setShowForm(false);
        router.refresh();
      }
    });
  }

  // 자동 제안
  function handleGenerateSuggestions() {
    startTransition(async () => {
      await generateSuggestions();
      router.refresh();
      // 페이지 새로고침으로 최신 데이터 가져옴
      window.location.reload();
    });
  }

  function handleScheduleSuggestion(id: string) {
    setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, status: "scheduled" as VisitStatus } : v)));
    startTransition(async () => {
      await scheduleSuggestion(id);
      router.refresh();
    });
  }

  function handleDismissSuggestion(id: string) {
    setVisits((prev) => prev.filter((v) => v.id !== id));
    startTransition(async () => {
      await dismissSuggestion(id);
      router.refresh();
    });
  }

  function handleBulkSchedule() {
    const ids = suggestions.map((s) => s.id);
    if (ids.length === 0) return;
    setVisits((prev) => prev.map((v) => (ids.includes(v.id) ? { ...v, status: "scheduled" as VisitStatus } : v)));
    startTransition(async () => {
      await bulkScheduleSuggestions(ids);
      router.refresh();
    });
  }

  function handleBulkDismiss() {
    if (!confirm("모든 제안을 무시하시겠습니까?")) return;
    const ids = suggestions.map((s) => s.id);
    setVisits((prev) => prev.filter((v) => !ids.includes(v.id)));
    startTransition(async () => {
      await bulkDismissSuggestions(ids);
      router.refresh();
    });
  }

  const tabClass = (t: Tab) =>
    `rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
      tab === t ? "bg-navy text-white" : "text-neutral-500 hover:bg-neutral-200"
    }`;

  const filterPillClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
      active ? "bg-navy text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
    }`;

  return (
    <div>
      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard value={stats.scheduled} label="예정된 심방" color="navy" />
        <StatCard value={stats.completed} label="이번 달 완료" color="accent" />
        <StatCard value={stats.followUp} label="후속 필요" color="neutral" />
        <div className="rounded-2xl bg-accent-light p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-accent">{stats.suggested}</p>
          <p className="mt-0.5 text-xs text-neutral-500">자동 제안</p>
        </div>
      </div>

      {/* 탭 + 새 심방 버튼 */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1">
          <button onClick={() => setTab("list")} className={tabClass("list")}>
            심방 목록
            {filteredVisits.length > 0 && <span className="ml-1 text-xs opacity-70">{filteredVisits.length}</span>}
          </button>
          <button onClick={() => setTab("suggestions")} className={tabClass("suggestions")}>
            자동 제안
            {suggestions.length > 0 && <span className="ml-1 text-xs opacity-70">{suggestions.length}</span>}
          </button>
          <button onClick={() => setTab("history")} className={tabClass("history")}>
            교인별 이력
          </button>
        </div>
        <button
          onClick={() => { setEditingVisit(null); setShowForm(true); }}
          className="rounded-xl bg-navy px-5 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          새 심방 등록
        </button>
      </div>

      {/* 탭 1: 심방 목록 */}
      {tab === "list" && (
        <div className="mt-4">
          {/* 필터 */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {(["all", "scheduled", "completed", "cancelled"] as StatusFilter[]).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={filterPillClass(statusFilter === s)}>
                  {s === "all" ? "전체" : VISIT_STATUS_LABELS[s as VisitStatus]}
                </button>
              ))}
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as VisitType | "all")}
              className="rounded-lg border border-neutral-200 px-2 py-1 text-xs outline-none"
            >
              <option value="all">유형 전체</option>
              {(Object.entries(VISIT_TYPE_LABELS) as [VisitType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {filteredVisits.length === 0 ? (
            <p className="mt-6 text-center text-sm text-neutral-400">심방 기록이 없습니다.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
                    <th className="px-4 py-3 font-medium">날짜</th>
                    <th className="px-4 py-3 font-medium">교인</th>
                    <th className="px-4 py-3 font-medium">유형</th>
                    <th className="px-4 py-3 font-medium">상태</th>
                    <th className="px-4 py-3 font-medium">심방자</th>
                    <th className="px-4 py-3 font-medium">후속</th>
                    <th className="px-4 py-3 font-medium">메모</th>
                    <th className="px-4 py-3 font-medium w-24">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-neutral-50 transition-colors hover:bg-neutral-50 cursor-pointer"
                      onClick={() => { setEditingVisit(v); setShowForm(true); }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(v.visit_date)}</td>
                      <td className="px-4 py-3 font-medium text-navy">{v.church_members?.name ?? "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{VISIT_TYPE_LABELS[v.visit_type]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE_VARIANT[v.status]}>{VISIT_STATUS_LABELS[v.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{visitorNames(v.visitor_ids)}</td>
                      <td className="px-4 py-3">
                        {v.follow_up_needed && (
                          <span className="text-xs text-accent font-medium">
                            {v.follow_up_date ? formatDate(v.follow_up_date) : "필요"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-neutral-400">{v.notes ?? ""}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {v.status === "scheduled" && (
                            <button
                              onClick={() => handleComplete(v)}
                              disabled={isPending}
                              className="rounded-lg px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
                              title="완료 처리"
                            >
                              완료
                            </button>
                          )}
                          {v.status === "completed" && (
                            <button
                              onClick={() => handleCreateFollowUp(v)}
                              disabled={isPending}
                              className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent-light disabled:opacity-50"
                              title="후속 심방 생성"
                            >
                              후속
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(v.id)}
                            disabled={isPending}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-50 disabled:opacity-50"
                            title="삭제"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 탭 2: 자동 제안 */}
      {tab === "suggestions" && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGenerateSuggestions}
              disabled={isPending}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              {isPending ? "생성 중..." : "제안 새로고침"}
            </button>
            {suggestions.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDismiss}
                  disabled={isPending}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 hover:bg-neutral-100 disabled:opacity-50"
                >
                  모두 무시
                </button>
                <button
                  onClick={handleBulkSchedule}
                  disabled={isPending}
                  className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
                >
                  전체 예정 등록
                </button>
              </div>
            )}
          </div>

          {suggestions.length === 0 ? (
            <p className="mt-6 text-center text-sm text-neutral-400">
              자동 제안이 없습니다. &quot;제안 새로고침&quot;을 눌러 생성하세요.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {/* 사유별 그룹핑 */}
              {Object.entries(
                suggestions.reduce(
                  (acc, s) => {
                    const reason = s.suggestion_reason ?? "other";
                    (acc[reason] ??= []).push(s);
                    return acc;
                  },
                  {} as Record<string, VisitRow[]>
                )
              ).map(([reason, items]) => (
                <div key={reason}>
                  <h4 className="mb-2 text-xs font-bold text-neutral-500 uppercase">
                    {SUGGESTION_REASONS[reason] ?? reason}
                  </h4>
                  <div className="space-y-1.5">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-navy">{s.church_members?.name ?? "-"}</span>
                          <Badge variant="accent">{VISIT_TYPE_LABELS[s.visit_type]}</Badge>
                          {s.visit_date && (
                            <span className="text-xs text-neutral-400">{formatDate(s.visit_date)}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleScheduleSuggestion(s.id)}
                            disabled={isPending}
                            className="rounded-lg bg-navy px-3 py-1 text-xs font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
                          >
                            예정 등록
                          </button>
                          <button
                            onClick={() => handleDismissSuggestion(s.id)}
                            disabled={isPending}
                            className="rounded-lg px-3 py-1 text-xs font-medium text-neutral-400 hover:bg-neutral-100 disabled:opacity-50"
                          >
                            무시
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 탭 3: 교인별 이력 */}
      {tab === "history" && (
        <div className="mt-4">
          {/* 교인 검색 */}
          <div className="flex gap-4">
            <div className="w-64">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="교인 이름 검색..."
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy"
              />
              {memberSearch && memberResults.length > 0 && (
                <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                  {memberResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedMemberId(m.id); setMemberSearch(""); }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent-light ${
                        selectedMemberId === m.id ? "bg-accent-light font-medium text-navy" : "text-neutral-700"
                      }`}
                    >
                      {m.name}
                      {m.phone && <span className="ml-2 text-xs text-neutral-400">{m.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMemberId && (
              <div className="flex items-start gap-2">
                <span className="rounded-full bg-navy/10 px-3 py-1.5 text-sm font-medium text-navy">
                  {members.find((m) => m.id === selectedMemberId)?.name}
                </span>
                <button
                  onClick={() => setSelectedMemberId(null)}
                  className="mt-1 text-xs text-neutral-400 hover:text-red-400"
                >
                  초기화
                </button>
              </div>
            )}
          </div>

          {!selectedMemberId ? (
            <p className="mt-6 text-center text-sm text-neutral-400">교인을 검색해서 선택하세요.</p>
          ) : memberVisits.length === 0 ? (
            <p className="mt-6 text-center text-sm text-neutral-400">심방 기록이 없습니다.</p>
          ) : (
            <div className="mt-4">
              {/* 요약 */}
              <div className="mb-4 flex gap-6 rounded-2xl bg-white p-4 shadow-sm">
                <div>
                  <p className="text-2xl font-bold text-navy">{memberVisits.length}</p>
                  <p className="text-xs text-neutral-500">총 심방 횟수</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-neutral-700">
                    {formatFullDate(
                      memberVisits
                        .filter((v) => v.visit_date)
                        .map((v) => v.visit_date!)
                        .sort()
                        .pop() ?? null
                    )}
                  </p>
                  <p className="text-xs text-neutral-500">마지막 심방일</p>
                </div>
                {(() => {
                  const lastPrayer = memberVisits
                    .filter((v) => v.prayer_request)
                    .sort((a, b) => (b.visit_date ?? "").localeCompare(a.visit_date ?? ""))[0];
                  return lastPrayer ? (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700 truncate">{lastPrayer.prayer_request}</p>
                      <p className="text-xs text-neutral-500">최근 기도제목</p>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* 타임라인 */}
              <div className="space-y-3">
                {memberVisits
                  .sort((a, b) => (b.visit_date ?? "").localeCompare(a.visit_date ?? ""))
                  .map((v) => (
                    <div key={v.id} className="rounded-xl bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{formatFullDate(v.visit_date)}</span>
                        <Badge variant={STATUS_BADGE_VARIANT[v.status]}>{VISIT_STATUS_LABELS[v.status]}</Badge>
                        <Badge variant="default">{VISIT_TYPE_LABELS[v.visit_type]}</Badge>
                        {v.visitor_ids.length > 0 && (
                          <span className="text-xs text-neutral-400">심방자: {visitorNames(v.visitor_ids)}</span>
                        )}
                      </div>
                      {v.notes && (
                        <p className="mt-2 text-sm text-neutral-600">{v.notes}</p>
                      )}
                      {v.prayer_request && (
                        <p className="mt-1 text-sm text-accent">기도: {v.prayer_request}</p>
                      )}
                      {v.location && (
                        <p className="mt-1 text-xs text-neutral-400">장소: {v.location}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showForm && (
        <VisitForm
          members={members}
          editingVisit={editingVisit}
          onSubmit={editingVisit ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingVisit(null); }}
          isPending={isPending}
        />
      )}
    </div>
  );
}
