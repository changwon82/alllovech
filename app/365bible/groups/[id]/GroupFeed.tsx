"use client";

import { useState, useEffect, useRef, useMemo, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { addComment, deleteComment, toggleReaction } from "./actions";
import Avatar from "@/app/components/ui/Avatar";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
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
  avatarUrl: string | null;
  comments: Comment[];
  reactions: Record<string, number>;
  myReaction: string | null;
};

const REACTION_EMOJI: Record<string, string> = {
  heart: "❤️",
  like: "👍",
  pray: "🙏",
  fire: "🔥",
  cry: "😢",
};

const REACTION_KEYS = Object.keys(REACTION_EMOJI);

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

function ReactionButton({
  reactions,
  myReaction,
  onToggle,
}: {
  reactions: Record<string, number>;
  myReaction: string | null;
  onToggle: (type: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = Object.values(reactions).reduce((s, n) => s + n, 0);

  const sorted = Object.entries(reactions)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-0.5 rounded-full transition-colors ${myReaction ? "bg-accent-light px-1.5 py-0.5 font-bold text-accent" : "hover:text-accent"}`}
      >
        {myReaction ? (
          <>
            <span className="text-xs">{REACTION_EMOJI[myReaction]}</span>
            {sorted.filter(([type]) => type !== myReaction).map(([type]) => (
              <span key={type} className="text-xs">{REACTION_EMOJI[type]}</span>
            ))}
            <span className="ml-0.5">{total}</span>
          </>
        ) : (
          <>
            {total > 0 && sorted.map(([type]) => (
              <span key={type} className="text-xs">{REACTION_EMOJI[type]}</span>
            ))}
            {total > 0 && <span className="ml-0.5">{total}</span>}
            <span>{total > 0 ? " · " : ""}공감</span>
          </>
        )}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 flex gap-0.5 rounded-full bg-white px-1.5 py-1 shadow-lg ring-1 ring-neutral-100">
          {REACTION_KEYS.map((type) => (
            <button
              key={type}
              onClick={() => {
                onToggle(type);
                setOpen(false);
              }}
              className={`rounded-full p-1 text-base transition-transform hover:scale-125 ${myReaction === type ? "bg-accent-light scale-110" : ""}`}
            >
              {REACTION_EMOJI[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentInput({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    if (!text.trim()) return;
    const value = text.trim();
    setText("");
    startTransition(() => {
      onSubmit(value);
    });
  }

  return (
    <div className="flex gap-2 pt-1">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === "Enter") handleSubmit(); }}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-b border-neutral-200 pb-1 text-xs outline-none focus:border-navy"
      />
      <button
        onClick={handleSubmit}
        disabled={isPending || !text.trim()}
        className="shrink-0 text-xs font-medium text-navy transition-all hover:brightness-110 disabled:opacity-50"
      >
        등록
      </button>
    </div>
  );
}

function CommentThread({
  comment,
  replies,
  currentUserId,
  onReply,
  onDelete,
}: {
  comment: Comment;
  replies: Comment[];
  currentUserId: string;
  onReply: (parentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);

  return (
    <div>
      {/* 원댓글 */}
      <div className="flex items-start justify-between gap-1">
        <p className="min-w-0 flex-1 text-sm leading-snug">
          <span className="font-bold text-neutral-800">{comment.profiles?.name ?? "이름 없음"}</span>{" "}
          <span className="text-neutral-600">{comment.content}</span>
          <span className="ml-1 text-[11px] text-neutral-300">{timeAgo(comment.created_at)}</span>
          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="ml-2 text-[11px] text-neutral-400 hover:text-navy"
          >
            답글
          </button>
        </p>
        {comment.user_id === currentUserId && (
          <button
            onClick={() => onDelete(comment.id)}
            className="shrink-0 text-[11px] text-neutral-300 hover:text-red-500"
          >
            삭제
          </button>
        )}
      </div>

      {/* 대댓글 목록 */}
      {replies.length > 0 && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-neutral-100 pl-3">
          {replies.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-1">
              <p className="min-w-0 flex-1 text-sm leading-snug">
                <span className="font-bold text-neutral-800">{r.profiles?.name ?? "이름 없음"}</span>{" "}
                <span className="text-neutral-600">{r.content}</span>
                <span className="ml-1 text-[11px] text-neutral-300">{timeAgo(r.created_at)}</span>
              </p>
              {r.user_id === currentUserId && (
                <button
                  onClick={() => onDelete(r.id)}
                  className="shrink-0 text-[11px] text-neutral-300 hover:text-red-500"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 대댓글 입력 */}
      {showReplyInput && (
        <div className="ml-4 mt-1 pl-3">
          <CommentInput
            placeholder="답글 입력..."
            onSubmit={(text) => {
              onReply(comment.id, text);
              setShowReplyInput(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function ReflectionCard({
  item,
  currentUserId,
  onToggleReaction,
  onAddComment,
  onAddReply,
  onDeleteComment,
}: {
  item: FeedItem;
  currentUserId: string;
  onToggleReaction: (type: string) => void;
  onAddComment: (text: string) => void;
  onAddReply: (parentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
}) {
  const [showComments, setShowComments] = useState(item.comments.length > 0);
  const [showInput, setShowInput] = useState(false);

  function handleAddComment(text: string) {
    onAddComment(text);
    setShowInput(false);
    setShowComments(true);
  }

  // 원댓글과 대댓글 분리
  const topLevel = item.comments.filter((c) => !c.parent_id);
  const repliesMap = new Map<string, Comment[]>();
  for (const c of item.comments) {
    if (c.parent_id) {
      const list = repliesMap.get(c.parent_id) ?? [];
      list.push(c);
      repliesMap.set(c.parent_id, list);
    }
  }

  return (
    <div className="flex gap-2.5">
      <Avatar avatarUrl={item.avatarUrl} name={item.authorName} seed={item.authorId} size="sm" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="rounded-lg bg-green-50 px-3 py-2">
          <p className="text-sm leading-snug text-neutral-800">
            <span className="font-bold">{item.authorName}</span>{" "}
            <span className="text-neutral-600">{item.content}</span>
          </p>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-neutral-400">
          <span>{timeAgo(item.created_at)}</span>
          <ReactionButton reactions={item.reactions} myReaction={item.myReaction} onToggle={onToggleReaction} />
          {item.comments.length > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:text-navy"
            >
              댓글 {item.comments.length}
            </button>
          )}
          <button
            onClick={() => setShowInput(!showInput)}
            className="hover:text-navy"
          >
            {item.comments.length === 0 ? "댓글" : "쓰기"}
          </button>
        </div>

        {showComments && topLevel.length > 0 && (
          <div className="mt-2 space-y-2">
            {topLevel.map((c) => (
              <CommentThread
                key={c.id}
                comment={c}
                replies={repliesMap.get(c.id) ?? []}
                currentUserId={currentUserId}
                onReply={onAddReply}
                onDelete={onDeleteComment}
              />
            ))}
          </div>
        )}
        {showInput && (
          <div className="mt-2">
            <CommentInput placeholder="댓글 입력..." onSubmit={handleAddComment} />
          </div>
        )}
      </div>
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

  useEffect(() => {
    const channel = supabase.channel(`group-feed-${groupId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        if (payload.senderId === currentUserId) return;
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== payload.reflectionId) return item;
            const reactions = { ...item.reactions };
            if (payload.oldType) {
              reactions[payload.oldType] = Math.max(0, (reactions[payload.oldType] ?? 0) - 1);
              if (reactions[payload.oldType] === 0) delete reactions[payload.oldType];
            }
            if (payload.toggled && payload.type) {
              reactions[payload.type] = (reactions[payload.type] ?? 0) + 1;
            }
            return { ...item, reactions };
          })
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

  // feed prop이 변경되면 items 동기화 (GroupCard 폴링에서 업데이트된 데이터 반영)
  const feedJsonRef = useRef("");
  useEffect(() => {
    const json = JSON.stringify(feed);
    if (json !== feedJsonRef.current) {
      feedJsonRef.current = json;
      setItems(feed);
    }
  }, [feed]);

  function broadcast(event: string, payload: Record<string, unknown>) {
    channelRef.current?.send({
      type: "broadcast",
      event,
      payload: { ...payload, senderId: currentUserId },
    });
  }

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

  function handleToggleReaction(reflectionId: string, type: string) {
    const item = items.find((i) => i.id === reflectionId);
    if (!item) return;
    const oldType = item.myReaction;
    const removing = oldType === type;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== reflectionId) return i;
        const reactions = { ...i.reactions };
        if (oldType) {
          reactions[oldType] = Math.max(0, (reactions[oldType] ?? 0) - 1);
          if (reactions[oldType] === 0) delete reactions[oldType];
        }
        if (!removing) {
          reactions[type] = (reactions[type] ?? 0) + 1;
        }
        return { ...i, reactions, myReaction: removing ? null : type };
      })
    );

    toggleReaction(reflectionId, type).then((result) => {
      if ("error" in result) {
        setItems((prev) =>
          prev.map((i) => {
            if (i.id !== reflectionId) return i;
            const reactions = { ...i.reactions };
            if (!removing) {
              reactions[type] = Math.max(0, (reactions[type] ?? 0) - 1);
              if (reactions[type] === 0) delete reactions[type];
            }
            if (oldType) {
              reactions[oldType] = (reactions[oldType] ?? 0) + 1;
            }
            return { ...i, reactions, myReaction: oldType };
          })
        );
      } else {
        broadcast("reaction", {
          reflectionId,
          toggled: !removing,
          type: removing ? null : type,
          oldType,
        });
        if (!removing && item) {
          const emoji = REACTION_EMOJI[type] ?? type;
          notifyAuthor(item.authorId, `${currentUserName}님이 ${emoji} 리액션했습니다`, item.day);
        }
      }
    });
  }

  function handleAddComment(reflectionId: string, text: string, parentId?: string) {
    const item = items.find((i) => i.id === reflectionId);
    addComment(reflectionId, text, parentId).then((result) => {
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
    // 대댓글도 함께 제거 (parent_id가 이 댓글인 것들)
    setItems((prev) =>
      prev.map((i) =>
        i.id === reflectionId
          ? { ...i, comments: i.comments.filter((c) => c.id !== commentId && c.parent_id !== commentId) }
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
          <Link href="/365bible" className="text-navy hover:underline">365 성경읽기</Link>에서 묵상을 작성하고 함께읽기에 공유해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {items.map((item) => (
        <ReflectionCard
          key={item.id}
          item={item}
          currentUserId={currentUserId}
          onToggleReaction={(type) => handleToggleReaction(item.id, type)}
          onAddComment={(text) => handleAddComment(item.id, text)}
          onAddReply={(parentId, text) => handleAddComment(item.id, text, parentId)}
          onDeleteComment={(commentId) => handleDeleteComment(item.id, commentId)}
        />
      ))}
    </div>
  );
}
