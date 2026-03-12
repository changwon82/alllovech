import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import Link from "next/link";
import ApprovalContent from "./ApprovalContent";
import ApprovalActions from "./ApprovalActions";
import DeleteButton from "./DeleteButton";
import ImagePreviews from "./ImagePreviews";
import SubmitButton from "./SubmitButton";

const R2_APPROVAL =
  "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/approval";

// 상태 파싱: "0|0" → { approved: false }, "1|2026-03-03 22:13:11" → { approved: true, date: "..." }
function parseStatus(status: string | null) {
  if (!status || status === "0|0") return { approved: false, date: null };
  const [code, ...rest] = status.split("|");
  const date = rest.join("|");
  if (code === "1" || code === "4") return { approved: true, date };
  return { approved: false, date: null };
}

// 금액 포맷
function formatAmount(amount: number | null): string {
  if (amount == null) return "-";
  return amount.toLocaleString("ko-KR") + "원";
}

// 파일 다운로드 URL 결정 (R2 레거시 vs Supabase 새 업로드)
function getFileUrl(fileName: string): string {
  if (fileName.startsWith("http")) return fileName;
  return `${R2_APPROVAL}/${fileName}`;
}

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  const { supabase, user } = await getSessionUser();

  const [{ data: post }, { data: items }, { data: files }] = await Promise.all([
    supabase.from("approval_posts").select("*").eq("id", postId).single(),
    supabase
      .from("approval_items")
      .select("item_name, standard, quantity, unit_price, total_price, note")
      .eq("post_id", postId)
      .order("id"),
    supabase
      .from("approval_files")
      .select("file_name, original_name, sort_order")
      .eq("post_id", postId)
      .order("sort_order"),
  ]);

  if (!post) notFound();

  // 조회수 증가
  await supabase
    .from("approval_posts")
    .update({ hit_count: (post.hit_count || 0) + 1 })
    .eq("id", postId);

  // cafe24 회원명 조회 (mb_id → 실명)
  const mbIds = [post.requester_mb_id, post.approver1_mb_id, post.approver2_mb_id].filter(Boolean);
  const { data: members } = mbIds.length > 0
    ? await supabase.from("cafe24_members").select("mb_id, name").in("mb_id", mbIds)
    : { data: [] };
  const nameMap = new Map((members || []).map((m) => [m.mb_id, m.name]));

  // 관리자 여부 + 현재 사용자의 결재 mb_id 조회
  let isAdmin = false;
  let currentUserMbId: string | null = null;
  if (user) {
    const [{ data: roles }, { data: myMember }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "ADMIN").maybeSingle(),
      supabase.from("approval_members").select("mb_id").eq("user_id", user.id).maybeSingle(),
    ]);
    isAdmin = !!roles;
    currentUserMbId = myMember?.mb_id || null;
  }

  // 결재 상태 파싱
  const approver1 = parseStatus(post.approver1_status);
  const approver2 = parseStatus(post.approver2_status);
  const finance = parseStatus(post.finance_status);
  const payment = parseStatus(post.payment_status);

  const requesterName = post.author_name || nameMap.get(post.requester_mb_id) || post.requester_mb_id || "-";
  const approver1Name = nameMap.get(post.approver1_mb_id) || post.approver1_mb_id || "-";
  const approver2Name = nameMap.get(post.approver2_mb_id) || post.approver2_mb_id || "-";

  // 세부항목 합계
  const totalAmount =
    items?.reduce((sum, item) => sum + (item.total_price || 0), 0) ?? 0;

  // 날짜 포맷 (결재일시)
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR") + " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="px-4 pt-4">
        {/* 목록으로 */}
        <Link
          href="/approval"
          className="mb-3 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
        >
          ← 목록으로
        </Link>

        {/* 제목 */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-800">{post.title}</h1>
          {post.doc_status === "draft" && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              임시저장
            </span>
          )}
        </div>

        {/* 메타 정보 */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
          <span>{new Date(post.post_date).toLocaleDateString("ko-KR")}</span>
          <span>·</span>
          <span className="text-xs text-neutral-400">조회 {post.hit_count}</span>
          <span>·</span>
          <span>청구자: {requesterName}</span>
          {post.doc_category && (
            <>
              <span>·</span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs">{post.doc_category}</span>
            </>
          )}
          {post.account_name && (
            <>
              <span>·</span>
              <span className="text-xs text-neutral-400">계정: {post.account_name}</span>
            </>
          )}
        </div>

        {/* 금액 */}
        <div className="mt-3 text-lg font-bold text-navy">
          {formatAmount(post.amount)}
        </div>
      </div>

      {/* 결재 흐름 (결재요청 후에만 표시) */}
      {post.doc_status === "submitted" && <div className="mt-6 px-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-neutral-700">결재 흐름</h3>
          <div className="flex items-start gap-0">
            {/* 청구자 */}
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                청구
              </div>
              <p className="mt-1.5 text-xs font-medium text-neutral-700">{requesterName}</p>
              <p className="text-[10px] text-neutral-400">청구자</p>
            </div>

            <div className="mt-5 flex-1 border-t border-dashed border-neutral-300" />

            {/* 1차 결재자 */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${
                  approver1.approved ? "bg-green-500" : "bg-neutral-300"
                }`}
              >
                1차
              </div>
              <p className="mt-1.5 text-xs font-medium text-neutral-700">{approver1Name}</p>
              {approver1.approved ? (
                <p className="text-[10px] text-green-500">{formatDate(approver1.date)}</p>
              ) : (
                <span className="mt-0.5 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500">
                  대기
                </span>
              )}
            </div>

            {/* 최종 결재자 (있을 때만) */}
            {post.approver2_mb_id && (
              <>
                <div className="mt-5 flex-1 border-t border-dashed border-neutral-300" />
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${
                      approver2.approved ? "bg-navy" : "bg-neutral-300"
                    }`}
                  >
                    최종
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-neutral-700">{approver2Name}</p>
                  {approver2.approved ? (
                    <p className="text-[10px] text-navy">{formatDate(approver2.date)}</p>
                  ) : (
                    <span className="mt-0.5 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500">
                      대기
                    </span>
                  )}
                </div>
              </>
            )}

            <div className="mt-5 flex-1 border-t border-dashed border-neutral-300" />

            {/* 재정결재 */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${
                  finance.approved ? "bg-purple-500" : "bg-neutral-300"
                }`}
              >
                재정
              </div>
              <p className="mt-1.5 text-xs font-medium text-neutral-700">재정</p>
              {finance.approved ? (
                <p className="text-[10px] text-purple-500">{formatDate(finance.date)}</p>
              ) : (
                <span className="mt-0.5 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500">
                  대기
                </span>
              )}
            </div>

            <div className="mt-5 flex-1 border-t border-dashed border-neutral-300" />

            {/* 지급 */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${
                  payment.approved ? "bg-accent" : "bg-neutral-300"
                }`}
              >
                지급
              </div>
              <p className="mt-1.5 text-xs font-medium text-neutral-700">회계</p>
              {payment.approved ? (
                <p className="text-[10px] text-accent">{formatDate(payment.date)}</p>
              ) : (
                <span className="mt-0.5 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500">
                  미지급
                </span>
              )}
            </div>
          </div>
        </div>
      </div>}

      {/* 관리자: 결재 처리 버튼 (결재요청 후에만) */}
      {post.doc_status === "submitted" && (isAdmin || currentUserMbId) && (
        <div className="mt-6 px-4">
          <ApprovalActions
            postId={postId}
            approver1Approved={approver1.approved}
            approver2Approved={approver2.approved}
            financeApproved={finance.approved}
            paymentApproved={payment.approved}
            hasApprover2={!!post.approver2_mb_id}
            currentUserMbId={currentUserMbId}
            approver1MbId={post.approver1_mb_id}
            approver2MbId={post.approver2_mb_id}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* 본문 내용 */}
      {post.content && (
        <div className="mt-6 px-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <ApprovalContent content={post.content} />
          </div>
        </div>
      )}

      {/* 세부항목 테이블 */}
      {items && items.length > 0 && (
        <div className="mt-6 px-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">세부항목</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-500">
                    <th className="px-2 py-2 text-left font-medium">품목</th>
                    <th className="px-2 py-2 text-left font-medium">규격</th>
                    <th className="px-2 py-2 text-right font-medium">수량</th>
                    <th className="px-2 py-2 text-right font-medium">단가</th>
                    <th className="px-2 py-2 text-right font-medium">금액</th>
                    <th className="px-2 py-2 text-left font-medium">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-neutral-50">
                      <td className="px-2 py-2 text-neutral-700">{item.item_name}</td>
                      <td className="px-2 py-2 text-neutral-500">{item.standard || "-"}</td>
                      <td className="px-2 py-2 text-right text-neutral-600">
                        {item.quantity?.toLocaleString("ko-KR") ?? "-"}
                      </td>
                      <td className="px-2 py-2 text-right text-neutral-600">
                        {item.unit_price?.toLocaleString("ko-KR") ?? "-"}
                      </td>
                      <td className="px-2 py-2 text-right font-medium text-neutral-700">
                        {item.total_price?.toLocaleString("ko-KR") ?? "-"}
                      </td>
                      <td className="px-2 py-2 text-neutral-500">{item.note || ""}</td>
                    </tr>
                  ))}
                  {/* 합계 */}
                  <tr className="border-t border-neutral-200 bg-neutral-50 font-semibold">
                    <td colSpan={4} className="px-2 py-2 text-right text-neutral-600">
                      합계
                    </td>
                    <td className="px-2 py-2 text-right text-navy">
                      {totalAmount.toLocaleString("ko-KR")}원
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 첨부파일 */}
      {files && files.length > 0 && (
        <div className="mt-6 px-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-600">첨부파일</h3>
          {/* 이미지 미리보기 */}
          {files.some((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.original_name || f.file_name)) && (
            <ImagePreviews
              images={files
                .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.original_name || f.file_name))
                .map((f) => ({ url: getFileUrl(f.file_name), name: f.original_name || f.file_name }))}
            />
          )}
          {/* 파일 목록 */}
          <div className="space-y-2">
            {files.map((file, i) => {
              const url = getFileUrl(file.file_name);
              const displayName = file.original_name || file.file_name;
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(displayName);
              return (
                <a
                  key={i}
                  href={url}
                  download={isImage ? undefined : displayName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                  <span className="shrink-0 text-base">
                    {/\.pdf$/i.test(displayName)
                      ? "\u{1F4C4}"
                      : /\.hwp$/i.test(displayName)
                        ? "\u{1F4DD}"
                        : /\.(zip|rar|7z)$/i.test(displayName)
                          ? "\u{1F4E6}"
                          : isImage
                            ? "\u{1F5BC}"
                            : "\u{1F4CE}"}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {displayName}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {isImage ? "원본보기" : "다운로드"}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* 결재요청 / 수정 / 삭제 버튼 */}
      {user && (isAdmin || post.requester_mb_id === user.id) && (
        <div className="mt-6 flex items-center gap-3 px-4">
          {post.doc_status === "draft" && (
            <>
              <SubmitButton postId={postId} />
              <Link
                href={`/approval/${postId}/edit`}
                className="rounded-xl border border-navy px-6 py-2 text-sm font-medium text-navy transition-all hover:bg-navy/5 active:scale-95"
              >
                문서 수정
              </Link>
            </>
          )}
          <DeleteButton postId={postId} />
        </div>
      )}

    </div>
  );
}
