"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, useTransition } from "react";
import Badge from "@/app/components/ui/Badge";
import Avatar from "@/app/components/ui/Avatar";
import GroupFeed from "./[id]/GroupFeed";
import { getGroupFeedData, getGroupMemberStatus } from "./actions";
import { createClient } from "@/lib/supabase/client";

const TYPE_LABEL: Record<string, string> = {
  dakobang: "다코방",
  family: "가족",
  free: "자유",
};

const CONTENT_LABEL: Record<string, string> = {
  "365bible": "365 성경읽기",
};

interface Member {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  checkedToday?: boolean;
  hasReflection?: boolean;
  lastCheckedDay?: number | null;
  totalChecked?: number;
}

interface GroupData {
  id: string;
  name: string;
  type: string;
  description: string | null;
  content_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  myRole: string;
  members: Member[];
}

type FeedData = {
  feed: Parameters<typeof GroupFeed>[0]["feed"];
  currentUserId: string;
  currentUserName: string;
  isLeader: boolean;
  inviteCode: string | null;
  groupName: string;
};

function InviteButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [isPending, startTransition] = useTransition();
  const [shared, setShared] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (code) {
      share(code);
    } else {
      startTransition(async () => {
        const { createInviteLink } = await import("./[id]/invite-actions");
        const result = await createInviteLink(groupId);
        if ("code" in result) {
          const newCode = result.code as string;
          setCode(newCode);
          share(newCode);
        }
      });
    }
  }

  async function share(inviteCode: string) {
    const url = `${window.location.origin}/365bible/invite/${inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${groupName} 함께읽기 초대`,
          text: `${groupName} 함께읽기에 초대합니다. 아래 링크를 눌러 합류하세요!`,
          url,
        });
        return;
      } catch { /* 취소 */ }
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
    >
      {shared ? "복사됨" : "초대하기"}
    </button>
  );
}

export default function GroupCard({ group: g, todayDay: initialTodayDay }: { group: GroupData; todayDay: number }) {
  const [feedData, setFeedData] = useState<FeedData | null>(null);
  const [, startTransition] = useTransition();
  const [showFeed, setShowFeed] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardTopRef = useRef<number | null>(null);

  // 카드 상단 위치 저장 → 렌더 후 스크롤 보정 (상단 고정, 하단만 변화)
  const pinCardTop = useCallback(() => {
    if (cardRef.current) {
      cardTopRef.current = cardRef.current.getBoundingClientRect().top;
    }
  }, []);

  useLayoutEffect(() => {
    if (cardTopRef.current === null || !cardRef.current) return;
    const newTop = cardRef.current.getBoundingClientRect().top;
    const diff = newTop - cardTopRef.current;
    if (Math.abs(diff) > 1) {
      window.scrollBy(0, diff);
    }
    cardTopRef.current = null;
  });

  // 마운트 시 자동으로 피드 로드
  useEffect(() => {
    if (g.status === "pending") return;
    startTransition(async () => {
      const result = await getGroupFeedData(g.id);
      if ("feed" in result) {
        setFeedData(result as FeedData);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.id]);
  const [members, setMembers] = useState(g.members);
  const [todayDay, setTodayDay] = useState(initialTodayDay);
  const [viewDay, setViewDay] = useState(initialTodayDay);
  const viewDayRef = useRef(initialTodayDay);
  const [navLoading, startNav] = useTransition();

  const supabase = useMemo(() => createClient(), []);

  // broadcast 수신 + 폴링 + visibilitychange로 출석/묵상/피드 실시간 반영
  useEffect(() => {
    if (g.status === "pending") return;

    function refreshMembers() {
      getGroupMemberStatus(g.id, viewDayRef.current).then((result) => {
        if ("members" in result && result.members) {
          setMembers(result.members as Member[]);
          setTodayDay(result.todayDay as number);
        }
      });
    }

    function refreshFeed() {
      getGroupFeedData(g.id).then((result) => {
        if ("feed" in result) {
          setFeedData(result as FeedData);
        }
      });
    }

    function refreshAll() {
      refreshMembers();
      refreshFeed();
    }

    // Supabase broadcast 수신 (즉시 반영)
    const channel = supabase.channel(`group-status-${g.id}`);
    channel
      .on("broadcast", { event: "member_update" }, () => {
        refreshAll();
      })
      .subscribe();

    // 폴링 (백업) — 멤버 15초, 피드 15초
    const interval = setInterval(refreshAll, 15_000);

    function handleVisibility() {
      if (document.visibilityState === "visible") refreshAll();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [g.id, g.status, supabase]);

  function goToDay(e: React.MouseEvent, targetDay: number) {
    e.stopPropagation();
    if (targetDay < 1 || targetDay > 365 || targetDay === viewDay) return;
    pinCardTop();
    setViewDay(targetDay);
    viewDayRef.current = targetDay;
    // 이동할 Day에 묵상이 없으면 자동 접기
    if (showFeed && feedData && feedData.feed.filter(f => f.day === targetDay).length === 0) {
      setShowFeed(false);
    }
    setMembers(prev => prev.map(m => ({ ...m, checkedToday: false, hasReflection: false })));
    startNav(async () => {
      const [memberResult, feedResult] = await Promise.all([
        getGroupMemberStatus(g.id, targetDay),
        getGroupFeedData(g.id),
      ]);
      if ("members" in memberResult && memberResult.members) {
        setMembers(memberResult.members as Member[]);
      }
      if ("feed" in feedResult) {
        setFeedData(feedResult as FeedData);
      }
    });
  }

  function navigateDay(e: React.MouseEvent, delta: number) {
    goToDay(e, viewDay + delta);
  }

  // 스와이프로 Day 이동
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return; // 세로 스와이프 무시
    const target = viewDay + (dx < 0 ? 1 : -1);
    if (target >= 1 && target <= 365) {
      pinCardTop();
      setViewDay(target);
      viewDayRef.current = target;
      if (showFeed && feedData && feedData.feed.filter(f => f.day === target).length === 0) {
        setShowFeed(false);
      }
      setMembers(prev => prev.map(m => ({ ...m, checkedToday: false, hasReflection: false })));
      startNav(async () => {
        const [memberResult, feedResult] = await Promise.all([
          getGroupMemberStatus(g.id, target),
          getGroupFeedData(g.id),
        ]);
        if ("members" in memberResult && memberResult.members) {
          setMembers(memberResult.members as Member[]);
        }
        if ("feed" in feedResult) {
          setFeedData(feedResult as FeedData);
        }
      });
    }
  }

  return (
    <div ref={cardRef} className={`rounded-2xl bg-white shadow-sm transition-shadow ${g.status === "pending" ? "opacity-70" : ""}`}>
      {/* 카드 헤더 */}
      <div className="w-full p-4 text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <Badge variant="default" className="shrink-0 whitespace-nowrap">
              {TYPE_LABEL[g.type] ?? g.type}
            </Badge>
            <h2 className="shrink-0 whitespace-nowrap text-sm font-bold text-neutral-800 md:text-base">{g.name}</h2>
            <span className="overflow-x-auto whitespace-nowrap text-xs text-neutral-500 scrollbar-none md:text-sm" style={{ scrollbarWidth: "none" }}>
              {members.length}명 참여
              {" · "}
              {CONTENT_LABEL[g.content_type] ?? g.content_type}
              {g.start_date && g.end_date && (
                <> · {g.start_date.slice(0, 7).replace("-", ".")} ~ {g.end_date.slice(0, 7).replace("-", ".")}</>
              )}
            </span>
          </div>
          {g.myRole === "leader" && g.status !== "pending" && (
            <InviteButton groupId={g.id} groupName={g.name} />
          )}
        </div>
        {g.description && (
          <p className="mt-1 text-sm text-neutral-500">{g.description}</p>
        )}
        {members.length > 0 && (
          <div className="mt-3 space-y-3 pt-3">
            {/* Day 내비게이션 */}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className={`flex items-center overflow-hidden rounded-full shadow-sm ${viewDay === todayDay ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-neutral-400 to-neutral-500"}`}>
              <button
                onClick={(e) => navigateDay(e, -1)}
                disabled={viewDay <= 1 || navLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center text-white/70 transition-all hover:text-white active:scale-90 disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className="flex flex-1 items-center justify-center gap-3 py-1.5 text-white">
                <span className="text-sm font-extrabold">Day {viewDay}</span>
                <span className="text-xs text-white/50">|</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-black leading-none">{members.filter(m => m.checkedToday).length}</span>
                  <span className="text-xs font-medium text-white/60">/{members.length} 읽음</span>
                </div>
                {viewDay !== todayDay && (
                  <>
                    <span className="text-xs text-white/50">|</span>
                    <button
                      onClick={(e) => goToDay(e, todayDay)}
                      disabled={navLoading}
                      className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white transition-all hover:bg-green-400 active:scale-95"
                    >
                      오늘
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={(e) => navigateDay(e, 1)}
                disabled={viewDay >= 365 || navLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center text-white/70 transition-all hover:text-white active:scale-90 disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
            </div>
            {/* 아바타 목록 — 가로 스크롤, 10% 겹침 */}
            <div className="mx-auto w-[98%] overflow-x-auto pt-2 scrollbar-none" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
              <div className="flex w-fit mx-auto" style={{ paddingRight: 8 }}>
                {members.map((member, i) => (
                  <div
                    key={member.userId}
                    className="flex shrink-0 flex-col items-center gap-1"
                    style={{ width: 64, marginLeft: i > 0 ? -6 : 0, zIndex: members.length - i }}
                  >
                    <div className={`relative h-16${member.checkedToday ? "" : " grayscale opacity-40"}`}>
                      <Avatar
                        avatarUrl={member.avatarUrl}
                        name={member.name}
                        seed={member.userId}
                        size="lg"
                      />
                      {member.role === "leader" && (
                        <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                          방장
                        </span>
                      )}
                      {member.checkedToday && (
                        <span className="absolute -right-0.5 -bottom-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shadow-sm">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </span>
                      )}
                      {member.hasReflection && (
                        <span className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-green-600/70 px-3 py-1 text-sm font-bold text-white shadow-sm animate-pulse" style={{ animationDuration: "4s" }}>
                          묵상
                        </span>
                      )}
                    </div>
                    <span className="max-w-full truncate text-xs text-neutral-600">{member.name}</span>
                    {member.lastCheckedDay != null && (
                      <span className={`text-xs font-bold ${member.lastCheckedDay === viewDay ? "text-green-600" : "text-neutral-500"}`}>
                        Day {member.lastCheckedDay}
                      </span>
                    )}
                    <span className={`text-xs font-bold ${(member.totalChecked ?? 0) >= todayDay ? "text-green-600" : "text-neutral-400"}`}>
                      {todayDay > 0 ? Math.round(((member.totalChecked ?? 0) / todayDay) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* 묵상 알림 버튼 */}
            {/* 묵상 바 — 스와이프로 Day 이동 가능 */}
            {feedData && (() => {
              const feedCount = feedData.feed.filter(f => f.day === viewDay).length;
              const hasReflections = feedCount > 0;
              return (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasReflections) return;
                      if (showFeed) {
                        pinCardTop();
                        setShowFeed(false);
                      } else {
                        setShowFeed(true);
                        requestAnimationFrame(() => {
                          feedRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        });
                      }
                    }}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-all active:scale-95 ${hasReflections ? "text-accent hover:bg-accent-light" : "text-neutral-400 cursor-default"}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {hasReflections
                      ? <>묵상 {feedCount}개 {showFeed ? "접기" : "보기"}</>
                      : <>묵상이 없습니다</>
                    }
                  </button>
                </div>
              );
            })()}
          </div>
        )}
        {g.status === "pending" && (
          <div className="mt-1.5">
            <Badge variant="accent">승인 대기</Badge>
          </div>
        )}
      </div>

      {/* 펼침: 피드 */}
      {feedData && (
        <div
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
          style={{ maxHeight: showFeed ? "none" : 0 }}
        >
          <div ref={feedRef} className="border-t border-neutral-100 px-4 pb-4 pt-3" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {(() => {
              const filtered = feedData.feed.filter((f) => f.day === viewDay);
              return filtered.length === 0
                ? <p className="py-6 text-center text-sm text-neutral-400">묵상이 없습니다</p>
                : <GroupFeed
                    key={`${g.id}-${viewDay}`}
                    feed={filtered}
                    currentUserId={feedData.currentUserId}
                    currentUserName={feedData.currentUserName}
                    groupId={g.id}
                  />;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
