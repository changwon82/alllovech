"use client";

import Link from "next/link";

type Post = {
  id: number;
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

export default function ApprovalTable({
  posts,
  nameMap,
}: {
  posts: Post[];
  nameMap: Record<string, string>;
}) {
  function getName(mbId: string | null, fallback?: string | null) {
    if (!mbId) return fallback || "-";
    return nameMap[mbId] || fallback || mbId;
  }

  return (
    <div className="mt-4 overflow-x-auto bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
            <th className="w-0 whitespace-nowrap px-1.5 py-1.5 text-center font-medium">번호</th>
            <th className="w-0 whitespace-nowrap px-1.5 py-1.5 text-center font-medium">문서분류</th>
            <th className="w-0 whitespace-nowrap px-1.5 py-1.5 text-center font-medium">계정이름</th>
            <th className="px-1.5 py-1.5 text-left font-medium">제목</th>
            <th className="w-0 whitespace-nowrap px-1.5 py-1.5 text-left font-medium">등록일시</th>
            <th className="w-0 whitespace-nowrap px-1.5 py-1.5 text-right font-medium">금액</th>
            <th className="w-0 whitespace-nowrap px-1.5 py-1.5 text-center font-medium"><div>품의</div><div className="text-xs font-normal text-neutral-400">(청구자)</div></th>
            <th className="w-0 whitespace-nowrap px-1.5 py-1.5 text-center font-medium">결재1</th>
            <th className="w-0 whitespace-nowrap px-1.5 py-1.5 text-center font-medium">결재2</th>
            <th className="w-0 whitespace-nowrap px-1.5 py-1.5 text-center font-medium">재정</th>
            <th className="w-0 whitespace-nowrap px-1.5 py-1.5 text-center font-medium">지급</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const a1 = parseStatus(post.approver1_status);
            const a2 = parseStatus(post.approver2_status);
            const fin = parseFinance(post.finance_status);
            const pay = parsePayment(post.payment_status);
            const requester = getName(post.requester_mb_id, post.author_name);

            return (
              <tr
                key={post.id}
                className="border-b border-neutral-50 transition-colors hover:bg-neutral-50"
              >
                <td className="whitespace-nowrap px-1.5 py-1 text-center text-neutral-400">
                  {post.id}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-center text-neutral-500">
                  {post.doc_category || "-"}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-center text-neutral-500">
                  {post.account_name || "-"}
                </td>
                <td className="px-1.5 py-1">
                  <Link
                    href={`/approval/${post.id}`}
                    className="inline-flex items-center gap-1.5 font-medium text-neutral-800 hover:text-navy"
                  >
                    <span className="line-clamp-1">{post.title}</span>
                    {post.doc_status === "draft" && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        임시저장
                      </span>
                    )}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-left text-neutral-400">
                  {formatDate(post.post_date)}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-right font-medium text-neutral-700">
                  {formatAmount(post.amount)}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-center">
                  <div className="text-neutral-600">{requester}</div>
                  <div className={`text-xs leading-none ${post.doc_status === "draft" ? "text-amber-600" : "text-green-600"}`}>
                    {post.doc_status === "draft" ? "작성중" : "품의"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-center">
                  <div className={a1.color}>{getName(post.approver1_mb_id)}</div>
                  <div className={`text-xs leading-none ${a1.color}`}>{a1.label}</div>
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-center">
                  <div className={a2.color}>{getName(post.approver2_mb_id)}</div>
                  <div className={`text-xs leading-none ${a2.color}`}>{a2.label}</div>
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-center">
                  <span className={`text-xs font-medium ${fin.color}`}>{fin.label}</span>
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-center">
                  <span className={`text-xs font-medium ${pay.color}`}>{pay.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
