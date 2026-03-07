"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import {
  getNotifications,
  markAllRead,
  markRead,
  deleteNotification,
  deleteAllNotifications,
  type EnrichedNotification,
} from "@/app/notifications/actions";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

const REACTION_EMOJI: Record<string, string> = {
  heart: "❤️", like: "👍", pray: "🙏", fire: "🔥", cry: "😢",
};

export default function NotificationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = useCallback(async () => {
    const { notifications: data } = await getNotifications();
    setNotifications(data);
    setLoading(false);
  }, []);

  // 모달 열릴 때 데이터 fetch + 실시간 동기화
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchNotifications();

    function handleChange() {
      fetchNotifications();
    }
    window.addEventListener("notification-change", handleChange);
    const interval = setInterval(fetchNotifications, 30_000);

    return () => {
      window.removeEventListener("notification-change", handleChange);
      clearInterval(interval);
    };
  }, [open, fetchNotifications]);

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    startTransition(async () => {
      await markAllRead();
      window.dispatchEvent(new Event("notification-change"));
    });
  }

  function handleClick(notification: EnrichedNotification) {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      startTransition(async () => {
        await markRead(notification.id);
        window.dispatchEvent(new Event("notification-change"));
      });
    }
    // 페이지 이동
    const isContact = notification.type === "contact";
    if (!isContact) {
      const isCommentOrAmen = notification.type === "comment" || notification.type === "amen";
      let href: string;
      if (isCommentOrAmen && notification.reference_id) {
        const params = new URLSearchParams({ ref: notification.reference_id });
        if (notification.group_id) params.set("group", notification.group_id);
        if (notification.type === "comment") {
          params.set("ht", "comment");
          if (notification.comment_id) params.set("cid", notification.comment_id);
        } else if (notification.type === "amen") {
          params.set("ht", "reaction");
        }
        href = `/365bible/groups?${params}`;
      } else {
        href = notification.reflection_day
          ? `/365bible?day=${notification.reflection_day}`
          : "/365bible/groups";
      }
      onClose();
      window.location.href = href;
    }
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    startTransition(async () => {
      await deleteNotification(id);
      window.dispatchEvent(new Event("notification-change"));
    });
  }

  function handleDeleteAll() {
    setNotifications([]);
    startTransition(async () => {
      await deleteAllNotifications();
      window.dispatchEvent(new Event("notification-change"));
    });
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 pt-14"
      onClick={onClose}
    >
      <div
        className="flex max-h-[55vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
          <h2 className="text-sm font-bold text-navy">알림{unreadCount > 0 && <span className="ml-1 text-xs font-normal text-accent">{unreadCount}</span>}</h2>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} disabled={isPending} className="text-[11px] text-neutral-400 hover:text-navy">읽음</button>
                )}
                <button onClick={handleDeleteAll} disabled={isPending} className="text-[11px] text-neutral-400 hover:text-red-500">비우기</button>
              </>
            )}
            <button onClick={onClose} className="-mr-1 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-px p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-neutral-50" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs text-neutral-400">알림이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-neutral-50 ${
                    n.is_read ? "" : "bg-accent-light/50"
                  }`}
                >
                  {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                  <p className={`min-w-0 flex-1 truncate text-[13px] leading-tight ${n.is_read ? "text-neutral-500" : "text-neutral-800"}`}>
                    {n.group_name && (
                      <span className="mr-1 text-[11px] text-neutral-400">{n.group_name}</span>
                    )}
                    {n.reflection_day != null && (
                      <span className="mr-1 font-semibold text-accent">D{n.reflection_day}</span>
                    )}
                    {n.type === "amen" && (
                      <span>{n.actor_name ?? "누군가"}님이 {n.message ? REACTION_EMOJI[n.message] ?? "🙏" : "🙏"} 공감했습니다</span>
                    )}
                    {n.type === "comment" && (
                      <><span className="mr-1 rounded bg-neutral-200 px-1 py-0.5 text-[10px] text-neutral-500">댓글</span><span className="font-medium">{n.actor_name ?? "누군가"}</span> <span className="text-neutral-400">{n.message ?? ""}</span></>
                    )}
                    {n.type === "contact" && (
                      <span>{n.actor_name ?? "누군가"} 문의</span>
                    )}
                    {n.type !== "amen" && n.type !== "comment" && n.type !== "contact" && (
                      <span>{n.actor_name ?? "누군가"} 활동</span>
                    )}
                  </p>
                  <span className="shrink-0 text-[10px] text-neutral-300">{timeAgo(n.created_at)}</span>
                  <span
                    role="button"
                    onClick={(e) => handleDelete(e, n.id)}
                    className="shrink-0 rounded-full p-0.5 text-neutral-300 hover:bg-neutral-200 hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
