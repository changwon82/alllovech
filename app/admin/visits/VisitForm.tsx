"use client";

import { useState, useRef, useEffect } from "react";
import type { VisitType, VisitStatus, VisitRow, CreateVisitInput } from "./actions";
import { VISIT_TYPE_LABELS } from "./actions";

type Member = { id: string; name: string; phone: string | null; birth_date: string | null; gender: string | null };

interface Props {
  members: Member[];
  editingVisit?: VisitRow | null;
  onSubmit: (data: CreateVisitInput) => void;
  onClose: () => void;
  isPending: boolean;
}

export default function VisitForm({ members, editingVisit, onSubmit, onClose, isPending }: Props) {
  const [memberId, setMemberId] = useState(editingVisit?.member_id ?? "");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberOpen, setMemberOpen] = useState(false);
  const [visitorIds, setVisitorIds] = useState<string[]>(editingVisit?.visitor_ids ?? []);
  const [visitorQuery, setVisitorQuery] = useState("");
  const [visitorOpen, setVisitorOpen] = useState(false);
  const [visitType, setVisitType] = useState<VisitType>(editingVisit?.visit_type ?? "regular");
  const [status, setStatus] = useState<VisitStatus>(editingVisit?.status ?? "scheduled");
  const [visitDate, setVisitDate] = useState(editingVisit?.visit_date ?? "");
  const [visitTime, setVisitTime] = useState(editingVisit?.visit_time ?? "");
  const [location, setLocation] = useState(editingVisit?.location ?? "");
  const [notes, setNotes] = useState(editingVisit?.notes ?? "");
  const [prayerRequest, setPrayerRequest] = useState(editingVisit?.prayer_request ?? "");
  const [followUpNeeded, setFollowUpNeeded] = useState(editingVisit?.follow_up_needed ?? false);
  const [followUpDate, setFollowUpDate] = useState(editingVisit?.follow_up_date ?? "");

  const memberRef = useRef<HTMLDivElement>(null);
  const visitorRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (memberRef.current && !memberRef.current.contains(e.target as Node)) setMemberOpen(false);
      if (visitorRef.current && !visitorRef.current.contains(e.target as Node)) setVisitorOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selectedMember = members.find((m) => m.id === memberId);
  const visitorSet = new Set(visitorIds);
  const memberSuggestions = memberQuery
    ? members.filter((m) => m.name.includes(memberQuery)).slice(0, 10)
    : [];
  const visitorSuggestions = visitorQuery
    ? members.filter((m) => !visitorSet.has(m.id) && m.name.includes(visitorQuery)).slice(0, 10)
    : [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    onSubmit({
      member_id: memberId,
      visitor_ids: visitorIds,
      visit_type: visitType,
      status,
      visit_date: visitDate || undefined,
      visit_time: visitTime || undefined,
      location: location || undefined,
      notes: notes || undefined,
      prayer_request: prayerRequest || undefined,
      follow_up_needed: followUpNeeded,
      follow_up_date: followUpNeeded && followUpDate ? followUpDate : undefined,
    });
  }

  const labelClass = "block text-xs font-medium text-neutral-500 mb-1";
  const inputClass = "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-navy">
          {editingVisit ? "심방 수정" : "새 심방 등록"}
        </h3>
        <div className="mt-1 h-0.5 w-8 rounded-full bg-accent" />

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 심방 대상 교인 */}
          <div ref={memberRef} className="relative">
            <label className={labelClass}>심방 대상 교인 *</label>
            {selectedMember ? (
              <div className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2">
                <span className="text-sm font-medium text-navy">{selectedMember.name}</span>
                {selectedMember.phone && (
                  <span className="text-xs text-neutral-400">{selectedMember.phone}</span>
                )}
                <button
                  type="button"
                  onClick={() => { setMemberId(""); setMemberQuery(""); }}
                  className="ml-auto text-xs text-neutral-400 hover:text-red-400"
                >
                  변경
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={memberQuery}
                  onChange={(e) => { setMemberQuery(e.target.value); setMemberOpen(true); }}
                  onFocus={() => memberQuery && setMemberOpen(true)}
                  placeholder="이름 검색..."
                  className={inputClass}
                  autoFocus
                />
                {memberOpen && memberSuggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                    {memberSuggestions.map((m) => (
                      <li
                        key={m.id}
                        onMouseDown={() => { setMemberId(m.id); setMemberQuery(""); setMemberOpen(false); }}
                        className="cursor-pointer px-3 py-1.5 text-sm text-neutral-700 hover:bg-accent-light hover:text-navy"
                      >
                        {m.name}
                        {m.phone && <span className="ml-2 text-xs text-neutral-400">{m.phone}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* 심방자 (복수 선택) */}
          <div ref={visitorRef} className="relative">
            <label className={labelClass}>심방자</label>
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-neutral-200 px-2 py-1.5">
              {visitorIds.map((vid) => {
                const v = members.find((m) => m.id === vid);
                return v ? (
                  <span
                    key={vid}
                    className="inline-flex items-center gap-0.5 rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy"
                  >
                    {v.name}
                    <button
                      type="button"
                      onClick={() => setVisitorIds((prev) => prev.filter((id) => id !== vid))}
                      className="ml-0.5 text-neutral-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
              <input
                type="text"
                value={visitorQuery}
                onChange={(e) => { setVisitorQuery(e.target.value); setVisitorOpen(true); }}
                onFocus={() => visitorQuery && setVisitorOpen(true)}
                placeholder={visitorIds.length === 0 ? "이름 검색..." : ""}
                className="min-w-[60px] flex-1 bg-transparent py-0.5 text-sm outline-none"
              />
            </div>
            {visitorOpen && visitorSuggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                {visitorSuggestions.map((m) => (
                  <li
                    key={m.id}
                    onMouseDown={() => {
                      setVisitorIds((prev) => [...prev, m.id]);
                      setVisitorQuery("");
                      setVisitorOpen(false);
                    }}
                    className="cursor-pointer px-3 py-1.5 text-sm text-neutral-700 hover:bg-accent-light hover:text-navy"
                  >
                    {m.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 유형 + 상태 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>심방 유형</label>
              <select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as VisitType)}
                className={inputClass}
              >
                {(Object.entries(VISIT_TYPE_LABELS) as [VisitType, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VisitStatus)}
                className={inputClass}
              >
                <option value="scheduled">예정</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
                <option value="no_show">부재</option>
              </select>
            </div>
          </div>

          {/* 날짜 + 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>날짜</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>시간</label>
              <input
                type="text"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                placeholder="예: 오후 2시"
                className={inputClass}
              />
            </div>
          </div>

          {/* 장소 */}
          <div>
            <label className={labelClass}>장소</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="자택, 병원, 교회 등"
              className={inputClass}
            />
          </div>

          {/* 메모 */}
          <div>
            <label className={labelClass}>메모</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass + " resize-none"}
              placeholder="심방 내용, 특이사항 등"
            />
          </div>

          {/* 기도 제목 */}
          <div>
            <label className={labelClass}>기도 제목</label>
            <textarea
              value={prayerRequest}
              onChange={(e) => setPrayerRequest(e.target.value)}
              rows={2}
              className={inputClass + " resize-none"}
              placeholder="교인의 기도 제목"
            />
          </div>

          {/* 후속 심방 */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={followUpNeeded}
                onChange={(e) => setFollowUpNeeded(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-navy accent-navy"
              />
              후속 심방 필요
            </label>
            {followUpNeeded && (
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-navy"
              />
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!memberId || isPending}
              className="rounded-xl bg-navy px-6 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isPending ? "저장 중..." : editingVisit ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
