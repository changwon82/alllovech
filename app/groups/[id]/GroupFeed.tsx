"use client";

import { useState, useEffect, useRef, useMemo, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { addComment, deleteComment, toggleAmen } from "./actions";
import Badge from "@/app/components/ui/Badge";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { name: string };
};

type FeedItem = {
  id: string;
  day: number;
  year: number;
  content: string;
  created_at: string;
  authorName: string;
  authorId: string;
  comments: Comment[];
  amenCount: number;
  myAmen: boolean;
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

function ReflectionCard({
  item,
  currentUserId,
  onToggleAmen,
  onAddComment,
  onDeleteComment,
}: {
  item: FeedItem;
  currentUserId: string;
  onToggleAmen: () => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAddComment() {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");
    startTransition(() => {
      onAddComment(text);
    });
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
            {item.authorName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-800">{item.authorName}</p>
            <p className="text-xs text-neutral-400">{timeAgo(item.created_at)}</p>
          </div>
        </div>
        <Link href={`/365bible?day=${item.day}`}>
          <Badge variant="accent">Day {item.day}</Badge>
        </Link>
      </div>

      {/* 묵상 내용 */}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
        {item.content}
      </p>

      {/* 아멘 + 댓글 버튼 */}
      <div className="mt-3 flex items-center gap-4 border-t border-neutral-100 pt-3">
        <button
          onClick={onToggleAmen}
          className={`flex items-center gap-1 text-xs transition-colors ${
            item.myAmen ? "font-bold text-accent" : "text-neutral-500 hover:text-accent"
          }`}
        >
          {item.myAmen ? "아멘 ✓" : "아멘"}
          {item.amenCount > 0 && <span className="text-neutral-400">{item.amenCount}</span>}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-navy"
        >
          댓글
          {item.comments.length > 0 && <span className="text-neutral-400">{item.comments.length}</span>}
        </button>
      </div>

      {/* 댓글 영역 */}
      {showComments && (
        <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
          {item.comments.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-neutral-700">{c.profiles?.name ?? "이름 없음"}</span>
                <span className="ml-1.5 text-xs text-neutral-600">{c.content}</span>
                <span className="ml-1.5 text-xs text-neutral-300">{timeAgo(c.created_at)}</span>
              </div>
              {c.user_id === currentUserId && (
                <button
                  onClick={() => onDeleteComment(c.id)}
                  className="shrink-0 text-xs text-neutral-300 hover:text-red-500"
                >
                  삭제
                </button>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="댓글 입력..."
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs outline-none focus:border-navy"
            />
            <button
              onClick={handleAddComment}
              disabled={isPending || !commentText.trim()}
              className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupFeed({
  feed,
  currentUserId,
  currentUserName,
  groupId,
}: {
  feed: FeedItem[];
  currentUserId: string;
  currentUserName: string;
  groupId: string;
}) {
  const [items, setItems] = useState(feed);
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Realtime broadcast 구독
  useEffect(() => {
    const channel = supabase.channel(`group-feed-${groupId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "amen" }, ({ payload }) => {
        if (payload.senderId === currentUserId) return;
        setItems((prev) =>
          prev.map((item) =>
            item.id === payload.reflectionId
              ? { ...item, amenCount: item.amenCount + (payload.toggled ? 1 : -1) }
              : item
          )
        );
      })
      .on("broadcast", { event: "comment_add" }, ({ payload }) => {
        if (payload.senderId === currentUserId) return;
        setItems((prev) =>
          prev.map((item) =>
            item.id === payload.reflectionId
              ? { ...item, comments: [...item.comments, payload.comment] }
              : item
          )
        );
      })
      .on("broadcast", { event: "comment_delete" }, ({ payload }) => {
        if (payload.senderId === currentUserId) return;
        setItems((prev) =>
          prev.map((item) =>
            item.id === payload.reflectionId
              ? { ...item, comments: item.comments.filter((c) => c.id !== payload.commentId) }
              : item
          )
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, currentUserId, supabase]);

  function broadcast(event: string, payload: Record<string, unknown>) {
    channelRef.current?.send({
      type: "broadcast",
      event,
      payload: { ...payload, senderId: currentUserId },
    });
  }

  // 묵상 작성자에게 알림 팝업 전송
  function notifyAuthor(authorId: string, message: string, reflectionDay: number) {
    if (authorId === currentUserId) return;
    const notifChannel = supabase.channel(`user-notifications-${authorId}`);
    notifChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        notifChannel.send({
          type: "broadcast",
          event: "notification",
          payload: { message, href: `/365bible?day=${reflectionDay}` },
        });
        setTimeout(() => supabase.removeChannel(notifChannel), 1000);
      }
    });
  }

  function handleToggleAmen(reflectionId: string) {
    const item = items.find((i) => i.id === reflectionId);
    if (!item) return;
    const wasAmen = item.myAmen;

    // 낙관적 업데이트
    setItems((prev) =>
      prev.map((i) =>
        i.id === reflectionId
          ? { ...i, myAmen: !wasAmen, amenCount: i.amenCount + (wasAmen ? -1 : 1) }
          : i
      )
    );

    toggleAmen(reflectionId).then((result) => {
      if ("error" in result) {
        // 롤백
        setItems((prev) =>
          prev.map((i) =>
            i.id === reflectionId
              ? { ...i, myAmen: wasAmen, amenCount: i.amenCount + (wasAmen ? 1 : -1) }
              : i
          )
        );
      } else {
        broadcast("amen", { reflectionId, toggled: !wasAmen });
        if (!wasAmen) {
          notifyAuthor(item.authorId, `${currentUserName}님이 아멘했습니다`, item.day);
        }
      }
    });
  }

  function handleAddComment(reflectionId: string, text: string) {
    const item = items.find((i) => i.id === reflectionId);
    addComment(reflectionId, text).then((result) => {
      if ("comment" in result && result.comment) {
        const comment = result.comment as unknown as Comment;
        setItems((prev) =>
          prev.map((i) =>
            i.id === reflectionId
              ? { ...i, comments: [...i.comments, comment] }
              : i
          )
        );
        broadcast("comment_add", { reflectionId, comment });
        if (item) {
          notifyAuthor(item.authorId, `${currentUserName}님이 댓글을 남겼습니다`, item.day);
        }
      }
    });
  }

  function handleDeleteComment(reflectionId: string, commentId: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === reflectionId
          ? { ...i, comments: i.comments.filter((c) => c.id !== commentId) }
          : i
      )
    );

    deleteComment(commentId).then((result) => {
      if ("error" in result) {
        window.location.reload();
      } else {
        broadcast("comment_delete", { reflectionId, commentId });
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-neutral-500">아직 공유된 묵상이 없습니다</p>
        <p className="mt-1 text-sm text-neutral-400">
          <Link href="/365bible" className="text-navy hover:underline">365 성경읽기</Link>에서 묵상을 작성하고 소그룹에 공유해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {items.map((item) => (
        <ReflectionCard
          key={item.id}
          item={item}
          currentUserId={currentUserId}
          onToggleAmen={() => handleToggleAmen(item.id)}
          onAddComment={(text) => handleAddComment(item.id, text)}
          onDeleteComment={(commentId) => handleDeleteComment(item.id, commentId)}
        />
      ))}
    </div>
  );
}
