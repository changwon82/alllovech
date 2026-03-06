"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDakobangGroup, createFamilyOrFreeGroup } from "./actions";

interface DakobangGroup {
  id: string;
  name: string;
  leaders: string[];
  used: boolean;
  usedStatus: "active" | "archived" | null;
}

type GroupType = "dakobang" | "family" | "free";

const TYPE_INFO: Record<GroupType, { label: string; sub: string; desc: string; icon: string }> = {
  dakobang: { label: "다코방", sub: "다코방과 함께", desc: "전화번호(뒷 4자리) 확인 후 바로 시작", icon: "👥" },
  family: { label: "가족", sub: "가족과 함께", desc: "관리자 승인 후 시작", icon: "🏠" },
  free: { label: "자유", sub: "자유롭게", desc: "관리자 승인 후 시작", icon: "✨" },
};

export default function CreateGroupForm({ dakobangGroups }: { dakobangGroups: DakobangGroup[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // 공통
  const year = new Date().getFullYear();
  const [groupType, setGroupType] = useState<GroupType>("dakobang");
  const [startDate, setStartDate] = useState(`${year}-01-01`);
  const [endDate, setEndDate] = useState(`${year}-12-31`);
  const [error, setError] = useState("");

  // 다코방
  const [query, setQuery] = useState("");
  const [selectedDg, setSelectedDg] = useState<DakobangGroup | null>(null);
  const [phoneLast4, setPhoneLast4] = useState("");
  const phoneRef = useRef<HTMLInputElement>(null);

  // 가족/자유
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  const filtered = query.trim()
    ? dakobangGroups.filter((dg) => {
        const q = query.trim().toLowerCase();
        return dg.name.toLowerCase().includes(q) || dg.leaders.some((l) => l.toLowerCase().includes(q));
      })
    : [];

  useEffect(() => {
    if (selectedDg) phoneRef.current?.focus();
  }, [selectedDg]);

  function reset() {
    setGroupType("dakobang");
    setQuery("");
    setSelectedDg(null);
    setPhoneLast4("");
    setGroupName("");
    setGroupDesc("");
    setError("");
    setStartDate(`${year}-01-01`);
    setEndDate(`${year}-12-31`);
  }

  function handleDakobangSubmit() {
    if (!selectedDg || phoneLast4.length !== 4) return;
    startTransition(async () => {
      const result = await createDakobangGroup(selectedDg.id, phoneLast4, startDate, endDate);
      if (result.groupId) {
        reset();
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "생성 실패");
      }
    });
  }

  function handleFreeSubmit() {
    if (!groupName.trim()) return;
    startTransition(async () => {
      const result = await createFamilyOrFreeGroup(groupName, groupType as "family" | "free", groupDesc, "365bible", startDate, endDate);
      if (result.groupId) {
        reset();
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "생성 실패");
      }
    });
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* 헤더 (항상 보임, 토글) */}
      <button
        type="button"
        onClick={() => { if (open) { reset(); } setOpen(!open); }}
        className="flex w-full items-center justify-between bg-navy px-5 py-3.5"
      >
        <h3 className="font-bold text-white">함께읽기 만들기</h3>
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white/50 transition-colors hover:text-white">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white/50">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        )}
      </button>

      {/* 펼침 내용 */}
      {open && <div className="p-5">
        {/* 타입 선택 카드 */}
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(TYPE_INFO) as [GroupType, { label: string; sub: string; desc: string; icon: string }][]).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setGroupType(key); setError(""); setSelectedDg(null); setQuery(""); setPhoneLast4(""); setGroupName(""); setGroupDesc(""); }}
              className={`relative rounded-xl px-2 py-4 text-center transition-all ${
                groupType === key
                  ? "bg-navy text-white shadow-md ring-2 ring-navy/20"
                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span className="text-2xl">{info.icon}</span>
              <p className={`mt-1 text-base font-bold ${groupType === key ? "text-white" : "text-neutral-700"}`}>
                {info.label}
              </p>
              <p className={`mt-0.5 text-xs ${groupType === key ? "font-semibold text-white/80" : "text-neutral-400"}`}>
                {info.sub}
              </p>
              {groupType === key && (
                <div className="absolute top-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-accent shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="h-5 w-5">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-neutral-400">{TYPE_INFO[groupType].desc}</p>

        {/* 내용 + 기간 */}
        <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-accent-light px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-accent">
              <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06v-11a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.339A.75.75 0 0 0 2 4.06v11a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-700">
            {"내용 : "}
            <span className="font-semibold text-navy">365 성경읽기</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-accent-light px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-accent">
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-700">
            {"기간 : "}
            <span className="font-semibold text-navy">
              {`${startDate.slice(0, 4)}년`}
            </span>
            <span className="text-neutral-400">
              {`(${parseInt(startDate.slice(5, 7))}.${parseInt(startDate.slice(8, 10))}-${parseInt(endDate.slice(5, 7))}.${parseInt(endDate.slice(8, 10))})`}
            </span>
          </span>
        </div>
        </div>

        {/* 다코방 상세 */}
        {groupType === "dakobang" && (
          <div className="mt-4">
            {!selectedDg ? (
              <>
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-300">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="다코방 이름 또는 방장 이름 검색"
                    className="w-full rounded-xl border border-neutral-200 py-2.5 pr-3 pl-9 text-sm outline-none transition-colors focus:border-navy focus:ring-1 focus:ring-navy/10"
                  />
                </div>
                {query.trim() && (
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50 p-1.5">
                    {filtered.length === 0 ? (
                      <p className="py-3 text-center text-sm text-neutral-400">검색 결과가 없습니다</p>
                    ) : (
                      filtered.map((dg) => (
                        <button
                          key={dg.id}
                          type="button"
                          disabled={dg.used}
                          onClick={() => !dg.used && setSelectedDg(dg)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            dg.used ? "cursor-not-allowed" : "hover:bg-white"
                          }`}
                        >
                          <div className="min-w-0">
                            <span className={`font-medium ${dg.used ? "text-neutral-400 line-through" : "text-neutral-800"}`}>
                              {dg.name}
                            </span>
                            {dg.leaders.length > 0 && (
                              <span className={`ml-2 text-xs ${dg.used ? "text-neutral-300" : "text-neutral-400"}`}>
                                {dg.leaders.join(", ")}
                              </span>
                            )}
                          </div>
                          {dg.used ? (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              dg.usedStatus === "archived"
                                ? "bg-neutral-100 text-neutral-400"
                                : "bg-green-50 text-green-500"
                            }`}>
                              {dg.usedStatus === "archived" ? "보관됨" : "활성 중"}
                            </span>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-neutral-300">
                              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-accent/20 bg-accent-light p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm">
                      👥
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-800">{selectedDg.name}</p>
                      {selectedDg.leaders.length > 0 && (
                        <p className="text-xs text-neutral-500">{selectedDg.leaders.join(", ")}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedDg(null); setPhoneLast4(""); setError(""); }}
                    className="rounded-lg px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-white hover:text-neutral-600"
                  >
                    변경
                  </button>
                </div>
                <div className="mt-3 rounded-lg bg-white p-3">
                  <p className="text-xs font-medium text-neutral-500">방장 전화번호 뒷자리 4자리를 입력하세요</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      ref={phoneRef}
                      type="tel"
                      inputMode="numeric"
                      maxLength={4}
                      value={phoneLast4}
                      onChange={(e) => { setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter" && phoneLast4.length === 4) handleDakobangSubmit(); }}
                      placeholder="0000"
                      className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-center text-base font-semibold tracking-[0.3em] outline-none transition-colors focus:border-navy focus:ring-1 focus:ring-navy/10"
                    />
                    <button
                      type="button"
                      disabled={isPending || phoneLast4.length !== 4}
                      onClick={handleDakobangSubmit}
                      className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                    >
                      {isPending ? "생성 중…" : "시작하기"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 가족/자유 상세 */}
        {groupType !== "dakobang" && (
          <div className="mt-4 space-y-2.5">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="그룹 이름"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-navy focus:ring-1 focus:ring-navy/10"
            />
            <input
              type="text"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              placeholder="한줄 설명 (선택)"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-navy focus:ring-1 focus:ring-navy/10"
            />
            <button
              type="button"
              disabled={isPending || !groupName.trim()}
              onClick={handleFreeSubmit}
              className="w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              {isPending ? "요청 중…" : "승인 요청하기"}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}
      </div>}
    </div>
  );
}
