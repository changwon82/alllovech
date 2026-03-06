"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { markAllRead, markRead, deleteNotification, deleteAllNotifications } from "./actions";

type Notification = {
  id: string;
  type: string;
  actor_name: string | null;
  reference_id: string | null;
  message: string | null;
  group_name: string | null;
  is_read: boolean;
  created_at: string;
  reflection_day: number | null;
};

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

export default function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // 서버에서 새 데이터가 오면 동기화
  useEffect(() => {
    setNotifications(initial);
  }, [initial]);

  // 커스텀 이벤트 + 폴링으로 새 알림 감지 시 서버 데이터 새로고침
  useEffect(() => {
    function refresh() {
      router.refresh();
    }
    window.addEventListener("notification-change", refresh);
    const interval = setInterval(refresh, 30_000);
    return () => {
      window.removeEventListener("notification-change", refresh);
      clearInterval(interval);
    };
  }, [router]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    startTransition(async () => {
      await markAllRead();
      window.dispatchEvent(new Event("notification-change"));
    });
  }

  function handleClick(notification: Notification) {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      startTransition(async () => {
        await markRead(notification.id);
        window.dispatchEvent(new Event("notification-change"));
      });
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

  if (notifications.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-neutral-500">알림이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex justify-end gap-3">
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-xs text-neutral-400 hover:text-navy"
          >
            모두 읽음 처리
          </button>
        )}
        <button
          onClick={handleDeleteAll}
          disabled={isPending}
          className="text-xs text-neutral-400 hover:text-red-500"
        >
          모두 삭제
        </button>
      </div>
      <div className="space-y-2">
        {notifications.map((n) => {
          const isContact = n.type === "contact";
          const isCommentOrAmen = n.type === "comment" || n.type === "amen";
          const href = isContact
            ? "#"
            : isCommentOrAmen && n.reference_id
              ? `/365bible/groups?ref=${n.reference_id}`
              : n.reflection_day
                ? `/365bible?day=${n.reflection_day}`
                : "/365bible/groups";
          return (
            <a
              key={n.id}
              href={href}
              onClick={(e) => { if (isContact) e.preventDefault(); handleClick(n); }}
              className={`block rounded-xl px-4 py-2.5 transition-shadow hover:shadow-md ${
                n.is_read
                  ? "bg-white shadow-sm"
                  : "bg-accent-light shadow-sm"
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
                  {isContact && (
                    <span>{n.actor_name ?? "누군가"}님이 문의를 보냈습니다</span>
                  )}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-neutral-400">{timeAgo(n.created_at)}</span>
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="text-neutral-300 hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
