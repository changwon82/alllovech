"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export type Post = {
  id: number;
  doc_number: number | null;
  title: string;
  author_name: string | null;
  requester_mb_id: string | null;
  amount: number | null;
  doc_category: string | null;
  doc_status: string | null;
  account_name: string | null;
  approver1_mb_id: string | null;
  approver1_status: string | null;
  approver2_mb_id: string | null;
  approver2_status: string | null;
  finance_status: string | null;
  payment_status: string | null;
  ref_department: string | null;
  ref_members: string | null;
  post_date: string;
  hit_count: number;
};

function parseStatus(status: string | null) {
  if (!status || status === "0|0") return { label: "미결재", color: "text-red-500" };
  const [code] = status.split("|");
  if (code === "1") return { label: "승인", color: "text-green-600" };
  if (code === "4") return { label: "집행", color: "text-green-600" };
  return { label: "미결재", color: "text-red-500" };
}

function parseFinance(status: string | null) {
  if (!status || status === "0|0") return { label: "대기", color: "text-neutral-400" };
  const [code] = status.split("|");
  if (code === "1" || code === "4") return { label: "승인", color: "text-green-600" };
  return { label: "대기", color: "text-neutral-400" };
}

function parsePayment(status: string | null) {
  if (!status || status === "0|0") return { label: "미지급", color: "text-neutral-400" };
  const [code] = status.split("|");
  if (code === "4") return { label: "집행", color: "text-green-600" };
  return { label: "결재대기", color: "text-purple-500" };
}

function formatAmount(amount: number | null): string {
  if (!amount) return "";
  return amount.toLocaleString("ko-KR");
}

function formatDate(postDate: string): string {
  const d = new Date(postDate);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = String(kst.getUTCFullYear() % 100).padStart(2, "0");
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${dd}`;
}

function Highlight({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword || !text) return <>{text}</>;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-inherit">{part}</mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function PostRow({ post, getName, search, searchField, currentUserMbId, isAdmin, currentUserDepts }: { post: Post; getName: (mbId: string | null, fallback?: string | null) => string; search: string; searchField: string; currentUserMbId: string | null; isAdmin: boolean; currentUserDepts: string[] }) {
  const a1 = parseStatus(post.approver1_status);
  const a2 = parseStatus(post.approver2_status);
  const fin = parseFinance(post.finance_status);
  const pay = parsePayment(post.payment_status);
  const requester = getName(post.requester_mb_id, post.author_name);

  return (
    <tr className="border-b border-neutral-300 transition-colors hover:bg-neutral-50">
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-center text-neutral-400">
        {searchField === "id" ? <Highlight text={String(post.doc_number || post.id)} keyword={search} /> : (post.doc_number || "-")}
      </td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-center text-neutral-500">{post.doc_category || "-"}</td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-center text-neutral-500">
        {searchField === "account" ? <Highlight text={post.account_name || "-"} keyword={search} /> : (post.account_name || "-")}
      </td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2">
        <Link href={`/approval/${post.id}`} className="inline-flex items-center gap-1.5 font-medium text-neutral-800 hover:text-navy">
          <span className="overflow-hidden whitespace-nowrap">
            {searchField === "title" || searchField === "content" ? <Highlight text={post.title} keyword={search} /> : post.title}
          </span>
          {post.doc_status === "draft" && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">임시저장</span>
          )}
        </Link>
      </td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-center text-neutral-400">{formatDate(post.post_date)}</td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-right font-medium text-neutral-700">{formatAmount(post.amount)}</td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-center">
        <div className="text-neutral-600">
          {searchField === "author" ? <Highlight text={requester} keyword={search} /> : requester}
        </div>
        <div className={`text-xs leading-none ${post.doc_status === "draft" ? "text-amber-600" : "text-green-600"}`}>
          {post.doc_status === "draft" ? "작성중" : "품의"}
        </div>
      </td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-center">
        <div className={a1.color}>{getName(post.approver1_mb_id)}</div>
        <div className={`text-xs leading-none ${a1.color}`}>{a1.label}</div>
      </td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-center">
        <div className={a2.color}>{getName(post.approver2_mb_id)}</div>
        <div className={`text-xs leading-none ${a2.color}`}>{a2.label}</div>
      </td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-center">
        <span className={`text-xs font-medium ${fin.color}`}>{fin.label}</span>
      </td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-center">
        <span className={`text-xs font-medium ${pay.color}`}>{pay.label}</span>
      </td>
      <td className="overflow-hidden whitespace-nowrap px-2 py-2 text-center">
        {(() => {
          if (!currentUserMbId && !isAdmin) return <span className="text-xs text-neutral-300">-</span>;
          if (isAdmin) return <span className="text-xs font-bold text-blue-600">Yes</span>;
          if (currentUserMbId === post.requester_mb_id) return <span className="text-xs font-bold text-blue-600">Yes</span>;
          if (currentUserMbId === post.approver1_mb_id || currentUserMbId === post.approver2_mb_id) return <span className="text-xs font-bold text-blue-600">Yes</span>;
          // 참조인원 확인
          try {
            const refMembers: string[] = post.ref_members ? JSON.parse(post.ref_members) : [];
            if (refMembers.includes(currentUserMbId!)) return <span className="text-xs font-bold text-blue-600">Yes</span>;
          } catch { /* */ }
          // 참조부서 확인
          if (currentUserDepts.length > 0) {
            try {
              const refDepts: string[] = post.ref_department ? JSON.parse(post.ref_department) : [];
              if (refDepts.some((d) => currentUserDepts.includes(d))) return <span className="text-xs font-bold text-blue-600">Yes</span>;
            } catch { /* */ }
          }
          return <span className="text-xs text-neutral-300">-</span>;
        })()}
      </td>
    </tr>
  );
}

export default function ApprovalTable({
  posts: initialPosts,
  nameMap: initialNameMap,
  totalCount,
  infiniteScroll,
  currentUserMbId = null,
  isAdmin = false,
  currentUserDepts = [],
}: {
  posts: Post[];
  nameMap: Record<string, string>;
  totalCount?: number;
  infiniteScroll?: boolean;
  currentUserMbId?: string | null;
  isAdmin?: boolean;
  currentUserDepts?: string[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [nameMap, setNameMap] = useState(initialNameMap);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(infiniteScroll ? initialPosts.length < (totalCount || 0) : false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const params = useSearchParams();

  // Reset when initialPosts change (new search/filter)
  useEffect(() => {
    setPosts(initialPosts);
    setNameMap(initialNameMap);
    setHasMore(infiniteScroll ? initialPosts.length < (totalCount || 0) : false);
  }, [initialPosts, initialNameMap, infiniteScroll, totalCount]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const sp = new URLSearchParams();
    sp.set("offset", String(posts.length));
    sp.set("limit", "100");
    const q = params.get("q");
    const sf = params.get("sf");
    const cat = params.get("cat");
    const from = params.get("from");
    const to = params.get("to");
    if (q) sp.set("q", q);
    if (sf) sp.set("sf", sf);
    if (cat) sp.set("cat", cat);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);

    const res = await fetch(`/approval/api?${sp.toString()}`);
    const data = await res.json();
    const newPosts: Post[] = data.posts;
    const newNameMap: Record<string, string> = data.nameMap;

    setPosts((prev) => [...prev, ...newPosts]);
    setNameMap((prev) => ({ ...prev, ...newNameMap }));
    if (newPosts.length < 100) setHasMore(false);
    setLoading(false);
  }, [loading, hasMore, posts.length, params]);

  useEffect(() => {
    if (!infiniteScroll || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [infiniteScroll, hasMore, loadMore]);

  function getName(mbId: string | null, fallback?: string | null) {
    if (!mbId) return fallback || "-";
    return nameMap[mbId] || fallback || mbId;
  }

  return (
    <>
      <div className="mt-4 overflow-x-auto bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <colgroup><col className="w-16" /><col className="w-28" /><col className="w-24" /><col /><col className="w-22" /><col className="w-24" /><col className="w-16" /><col className="w-16" /><col className="w-16" /><col className="w-14" /><col className="w-14" /><col className="w-14" /></colgroup>
          <thead>
            <tr className="border-b border-neutral-400 bg-neutral-200 text-neutral-600">
              <th className="px-2 py-2 text-center font-medium">번호</th>
              <th className="px-2 py-2 text-center font-medium">문서분류</th>
              <th className="px-2 py-2 text-center font-medium">계정이름</th>
              <th className="px-2 py-2 text-center font-medium">제목</th>
              <th className="px-2 py-2 text-center font-medium">등록일시</th>
              <th className="px-2 py-2 text-right font-medium">금액</th>
              <th className="px-2 py-2 text-center font-medium">품의</th>
              <th className="px-2 py-2 text-center font-medium">결재1</th>
              <th className="px-2 py-2 text-center font-medium">결재2</th>
              <th className="px-2 py-2 text-center font-medium">재정</th>
              <th className="px-2 py-2 text-center font-medium">지급</th>
              <th className="px-2 py-2 text-center font-medium">권한</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <PostRow key={post.id} post={post} getName={getName} search={params.get("q") || ""} searchField={params.get("sf") || "title"} currentUserMbId={currentUserMbId} isAdmin={isAdmin} currentUserDepts={currentUserDepts} />
            ))}
          </tbody>
        </table>
      </div>
      {infiniteScroll && hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {loading && <span className="text-sm text-neutral-400">불러오는 중...</span>}
        </div>
      )}
      {infiniteScroll && !hasMore && posts.length > 0 && (
        <div className="py-3 text-center text-sm text-neutral-400">
          전체 {posts.length}건
        </div>
      )}
    </>
  );
}
