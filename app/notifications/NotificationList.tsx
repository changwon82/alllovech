"use client";

import { useState, useTransition } from "react";
import { markAllRead, markRead } from "./actions";

type Notification = {
  id: string;
  type: string;
  actor_name: string | null;
  reference_id: string | null;
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

function getMessage(type: string, actorName: string | null): string {
  const name = actorName ?? "누군가";
  if (type === "comment") return `${name}님이 댓글을 남겼습니다`;
  if (type === "amen") return `${name}님이 아멘했습니다`;
  return `${name}님의 활동이 있습니다`;
}

export default function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    startTransition(async () => {
      await markAllRead();
    });
  }

  function handleClick(notification: Notification) {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      startTransition(async () => {
        await markRead(notification.id);
      });
    }
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
      {unreadCount > 0 && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-xs text-neutral-400 hover:text-navy"
          >
            모두 읽음 처리
          </button>
        </div>
      )}
      <div className="space-y-2">
        {notifications.map((n) => {
          const href = n.reflection_day ? `/365bible?day=${n.reflection_day}` : "/groups";
          return (
            <a
              key={n.id}
              href={href}
              onClick={() => handleClick(n)}
              className={`block rounded-xl border p-4 transition-colors hover:border-neutral-300 ${
                n.is_read
                  ? "border-neutral-100 bg-white"
                  : "border-blue/20 bg-blue/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-sm ${n.is_read ? "text-neutral-500" : "font-medium text-neutral-800"}`}>
                  {getMessage(n.type, n.actor_name)}
                </p>
                <span className="text-xs text-neutral-400">{timeAgo(n.created_at)}</span>
              </div>
              {n.reflection_day && (
                <p className="mt-1 text-xs text-blue">Day {n.reflection_day}</p>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
