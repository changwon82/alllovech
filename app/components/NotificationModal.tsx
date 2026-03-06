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
      const href = isCommentOrAmen && notification.reference_id
        ? `/365bible/groups?ref=${notification.reference_id}`
        : notification.reflection_day
          ? `/365bible?day=${notification.reflection_day}`
          : "/365bible/groups";
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
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 p-4 pt-16"
      onClick={onClose}
    >
      <div
        className="flex max-h-[70vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-base font-bold text-navy">알림</h2>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isPending}
                    className="text-xs text-neutral-400 hover:text-navy"
                  >
                    모두 읽음
                  </button>
                )}
                <button
                  onClick={handleDeleteAll}
                  disabled={isPending}
                  className="text-xs text-neutral-400 hover:text-red-500"
                >
                  모두 삭제
                </button>
              </>
            )}
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-500">알림이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`block w-full rounded-xl px-4 py-2.5 text-left transition-shadow hover:shadow-md ${
                    n.is_read ? "bg-neutral-50" : "bg-accent-light"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`min-w-0 flex-1 truncate text-sm ${n.is_read ? "text-neutral-500" : "font-medium text-neutral-800"}`}>
                      {n.group_name && (
                        <span className="mr-1 text-[11px] text-neutral-400">{n.group_name}</span>
                      )}
                      {n.reflection_day != null && (
                        <span className="mr-1 font-medium text-accent">Day {n.reflection_day}</span>
                      )}
                      {n.type === "amen" && (
                        <span>{n.actor_name ?? "누군가"}님이 {n.message ? REACTION_EMOJI[n.message] ?? "🙏" : "🙏"} 공감했습니다</span>
                      )}
                      {n.type === "comment" && (
                        <><span className="mr-1 rounded bg-neutral-200 px-1 py-0.5 text-[10px] text-neutral-500">댓글</span>{n.actor_name ?? "누군가"} <span className="text-neutral-400">{n.message ?? ""}</span></>
                      )}
                      {n.type === "contact" && (
                        <span>{n.actor_name ?? "누군가"}님이 문의를 보냈습니다</span>
                      )}
                      {n.type !== "amen" && n.type !== "comment" && n.type !== "contact" && (
                        <span>{n.actor_name ?? "누군가"}님의 활동</span>
                      )}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-neutral-400">{timeAgo(n.created_at)}</span>
                      <span
                        role="button"
                        onClick={(e) => handleDelete(e, n.id)}
                        className="text-neutral-300 hover:text-red-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
