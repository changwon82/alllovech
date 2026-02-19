"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addComment, deleteComment, toggleAmen } from "./actions";

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
}: {
  item: FeedItem;
  currentUserId: string;
}) {
  const [amenCount, setAmenCount] = useState(item.amenCount);
  const [myAmen, setMyAmen] = useState(item.myAmen);
  const [comments, setComments] = useState(item.comments);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggleAmen() {
    const wasAmen = myAmen;
    setMyAmen(!wasAmen);
    setAmenCount((prev) => prev + (wasAmen ? -1 : 1));

    startTransition(async () => {
      const result = await toggleAmen(item.id);
      if ("error" in result) {
        setMyAmen(wasAmen);
        setAmenCount((prev) => prev + (wasAmen ? 1 : -1));
      }
    });
  }

  function handleAddComment() {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");

    startTransition(async () => {
      const result = await addComment(item.id, text);
      if ("comment" in result && result.comment) {
        setComments((prev) => [...prev, result.comment as unknown as Comment]);
      }
    });
  }

  function handleDeleteComment(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    startTransition(async () => {
      const result = await deleteComment(commentId);
      if ("error" in result) {
        // 실패 시 새로고침으로 복구
        window.location.reload();
      }
    });
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-4">
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
        <Link
          href={`/365bible?day=${item.day}`}
          className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200"
        >
          Day {item.day}
        </Link>
      </div>

      {/* 묵상 내용 */}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
        {item.content}
      </p>

      {/* 아멘 + 댓글 버튼 */}
      <div className="mt-3 flex items-center gap-4 border-t border-neutral-100 pt-3">
        <button
          onClick={handleToggleAmen}
          disabled={isPending}
          className={`flex items-center gap-1 text-xs transition-colors ${
            myAmen ? "font-bold text-blue" : "text-neutral-500 hover:text-blue"
          }`}
        >
          {myAmen ? "아멘 ✓" : "아멘"}
          {amenCount > 0 && <span className="text-neutral-400">{amenCount}</span>}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-navy"
        >
          댓글
          {comments.length > 0 && <span className="text-neutral-400">{comments.length}</span>}
        </button>
      </div>

      {/* 댓글 영역 */}
      {showComments && (
        <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-neutral-700">{c.profiles?.name ?? "이름 없음"}</span>
                <span className="ml-1.5 text-xs text-neutral-600">{c.content}</span>
                <span className="ml-1.5 text-xs text-neutral-300">{timeAgo(c.created_at)}</span>
              </div>
              {c.user_id === currentUserId && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
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
              className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy/90 disabled:opacity-50"
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
}: {
  feed: FeedItem[];
  currentUserId: string;
}) {
  if (feed.length === 0) {
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
      {feed.map((item) => (
        <ReflectionCard
          key={item.id}
          item={item}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}
