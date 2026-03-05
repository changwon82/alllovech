"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
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
      {isPending ? "..." : shared ? "복사됨" : "초대하기"}
    </button>
  );
}

export default function GroupCard({ group: g, todayDay: initialTodayDay }: { group: GroupData; todayDay: number }) {
  const [open, setOpen] = useState(g.status !== "pending");
  const [feedData, setFeedData] = useState<FeedData | null>(null);
  const [loading, startTransition] = useTransition();

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
    setViewDay(targetDay);
    viewDayRef.current = targetDay;
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

  function handleToggle() {
    if (g.status === "pending") return;
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!feedData) {
      startTransition(async () => {
        const result = await getGroupFeedData(g.id);
        if ("feed" in result) {
          setFeedData(result as FeedData);
        }
      });
    }
  }

  return (
    <div className={`rounded-2xl bg-white shadow-sm transition-shadow ${g.status === "pending" ? "opacity-70" : ""}`}>
      {/* 카드 헤더 */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        className={`w-full p-4 text-left ${g.status !== "pending" ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="default">
              {TYPE_LABEL[g.type] ?? g.type}
            </Badge>
            <h2 className="font-bold text-neutral-800">{g.name}</h2>
            <span className="text-sm text-neutral-500">
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
                      className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white transition-all hover:bg-white/30 active:scale-95"
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
            {/* 아바타 목록 */}
            <div className="flex flex-nowrap justify-center overflow-x-auto pt-2">
              {members.map((member, i) => (
                <div key={member.userId} className="flex shrink-0 flex-col items-center gap-1" style={i > 0 ? { marginLeft: -6 } : undefined}>
                  <div className={`relative${member.checkedToday ? "" : " grayscale opacity-40"}`}>
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
                  <span className="text-sm text-neutral-600">{member.name}</span>
                  {member.lastCheckedDay != null && (
                    <span className={`text-sm font-bold ${member.lastCheckedDay === viewDay ? "text-green-600" : "text-neutral-500"}`}>
                      Day {member.lastCheckedDay}
                    </span>
                  )}
                  <span className={`text-sm font-bold ${(member.totalChecked ?? 0) >= todayDay ? "text-green-600" : "text-neutral-400"}`}>
                    {todayDay > 0 ? Math.round(((member.totalChecked ?? 0) / todayDay) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {g.status === "pending" && (
          <div className="mt-1.5">
            <Badge variant="accent">승인 대기</Badge>
          </div>
        )}
      </div>

      {/* 펼침: 피드 */}
      {open && (
        <div className="border-t border-neutral-100 px-4 pb-4 pt-3">
          {loading && !feedData && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
            </div>
          )}
          {feedData && (() => {
            const filtered = feedData.feed.filter((f) => f.day === viewDay);
            if (filtered.length === 0) {
              return <p className="py-6 text-center text-sm text-neutral-400">Day {viewDay}에 공유된 묵상이 없습니다</p>;
            }
            return (
              <GroupFeed
                key={`${g.id}-${viewDay}`}
                feed={filtered}
                currentUserId={feedData.currentUserId}
                currentUserName={feedData.currentUserName}
                groupId={g.id}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}
