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

function parseStatus(status: string | null) {
  if (!status || status === "0|0") return { approved: false, date: null };
  const [code, ...rest] = status.split("|");
  const date = rest.join("|");
  if (code === "1" || code === "4") return { approved: true, date };
  return { approved: false, date: null };
}

function formatAmount(amount: number | null): string {
  if (amount == null) return "-";
  return amount.toLocaleString("ko-KR") + "원";
}

function getFileUrl(fileName: string): string {
  if (fileName.startsWith("http")) return fileName;
  return `${R2_APPROVAL}/${fileName}`;
}

/** 날짜 문자열 → KST 포맷 문자열 변환 (Intl API로 타임존 확실히 처리) */
function toKSTString(dateStr: string): { y: number; m: number; d: number; hh: number; mm: number } {
  const date = new Date(dateStr);
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour"), mm: get("minute") };
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const { y, m, d, hh, mm } = toKSTString(dateStr);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "-";
  const { y, m, d, hh, mm } = toKSTString(dateStr);
  return `${String(y).slice(-2)}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  const { supabase, user } = await getSessionUser();

  const [{ data: post }, { data: items }, { data: files }, { data: comments }] = await Promise.all([
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
    supabase
      .from("approval_comments")
      .select("id, name, step, status, comment, created_at")
      .eq("post_id", postId)
      .order("created_at"),
  ]);

  if (!post) notFound();

  // 조회수 증가
  await supabase
    .from("approval_posts")
    .update({ hit_count: (post.hit_count || 0) + 1 })
    .eq("id", postId);

  // 예산 정보 조회
  const { data: budget } = post.account_name
    ? await supabase
        .from("approval_budgets")
        .select("committee, account, budget, spending, balance, purpose, chairman, manager")
        .eq("year", new Date().getFullYear().toString())
        .eq("account", post.account_name)
        .maybeSingle()
    : { data: null };

  // 회원명 + 직분 조회
  const mbIds = [post.requester_mb_id, post.approver1_mb_id, post.approver2_mb_id].filter(Boolean);
  const { data: members } = mbIds.length > 0
    ? await supabase.from("approval_members").select("mb_id, name, position").in("mb_id", mbIds)
    : { data: [] };
  const nameMap = new Map((members || []).map((m) => [m.mb_id, m.name]));
  const posMap = new Map((members || []).map((m) => [m.mb_id, m.position]));

  // 관리자 + 현재 사용자
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

  // 결재 상태
  const approver1 = parseStatus(post.approver1_status);
  const approver2 = parseStatus(post.approver2_status);
  const finance = parseStatus(post.finance_status);
  const payment = parseStatus(post.payment_status);

  const requesterName = post.author_name || nameMap.get(post.requester_mb_id) || post.requester_mb_id || "-";
  const approver1Name = nameMap.get(post.approver1_mb_id) || post.approver1_mb_id || "-";
  const approver2Name = nameMap.get(post.approver2_mb_id) || post.approver2_mb_id || "-";
  const approver1Pos = posMap.get(post.approver1_mb_id) || "";
  const approver2Pos = posMap.get(post.approver2_mb_id) || "";

  // 참조부서/참조인원
  let refDepts: string[] = [];
  let refMemberIds: string[] = [];
  try { refDepts = post.ref_department ? JSON.parse(post.ref_department) : []; } catch { /* */ }
  try { refMemberIds = post.ref_members ? JSON.parse(post.ref_members) : []; } catch { /* */ }

  // 참조인원 이름 조회
  const { data: refMemberNames } = refMemberIds.length > 0
    ? await supabase.from("approval_members").select("mb_id, name").in("mb_id", refMemberIds)
    : { data: [] };
  const refNameMap = new Map((refMemberNames || []).map((m) => [m.mb_id, m.name]));

  const totalAmount =
    items?.reduce((sum, item) => sum + (item.total_price || 0), 0) ?? 0;

  const labelClass = "whitespace-nowrap bg-neutral-50 px-4 py-3 text-center text-sm font-semibold text-neutral-600";
  const valueClass = "px-4 py-3 text-sm text-neutral-900";

  return (
    <>
      {/* 상단 버튼 */}
      {user && (isAdmin || post.requester_mb_id === user.id) && (
        <div className="flex items-center justify-end gap-2">
          {post.doc_status === "draft" && (
            <>
              <SubmitButton postId={postId} />
              <Link
                href={`/approval/${postId}/edit`}
                className="rounded border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
              >
                문서수정
              </Link>
            </>
          )}
          {post.doc_status === "submitted" && isAdmin && (
            <Link
              href={`/approval/${postId}/edit`}
              className="rounded border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
            >
              문서수정
            </Link>
          )}
          <DeleteButton postId={postId} />
          <Link
            href="/approval"
            className="rounded border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
          >
            목록으로
          </Link>
        </div>
      )}

      {/* 예산 정보 바 */}
      {budget && (
        <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 px-2 py-3 text-base">
          <span className="rounded bg-neutral-200 px-2 py-0.5 text-sm font-semibold text-neutral-600">조직명</span>
          <span className="mr-4 font-medium text-neutral-900">{budget.committee}</span>
          <span className="rounded bg-neutral-200 px-2 py-0.5 text-sm font-semibold text-neutral-600">계정이름</span>
          <span className="mr-4 font-bold text-blue-600">{budget.account}</span>
          <span className="rounded bg-neutral-200 px-2 py-0.5 text-sm font-semibold text-neutral-600">예산설명</span>
          <span className="mr-4 flex-1 text-neutral-700">{budget.purpose || "-"}</span>
          <span className="rounded bg-neutral-200 px-2 py-0.5 text-sm font-semibold text-neutral-600">조직장</span>
          <span className="mr-4 font-medium text-neutral-900">{budget.chairman || "-"}</span>
          <span className="rounded bg-neutral-200 px-2 py-0.5 text-sm font-semibold text-neutral-600">담당자</span>
          <span className="font-medium text-neutral-900">{budget.manager || "-"}</span>
        </div>
      )}

      {/* 문서 헤더 */}
      <div className="mt-3 overflow-hidden border border-neutral-200">
        {/* 문서분류 + 결재선 */}
        <div className="flex border-b border-neutral-200">
          <div className="flex w-36 shrink-0 items-center justify-center border-r border-neutral-200 bg-neutral-50 px-4 py-4">
            <div className="text-center">
              <div className="text-lg font-bold text-neutral-800">{post.doc_category || "-"}</div>
              {post.doc_status === "draft" && (
                <span className="mt-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">임시저장</span>
              )}
              {post.doc_status === "submitted" && (
                <span className="mt-1 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">결재진행</span>
              )}
            </div>
          </div>
          <div className="flex flex-1 items-stretch gap-3 p-3">
            {/* 품의자 */}
            <div className="flex flex-1 flex-col items-center justify-center rounded border border-neutral-300 py-3">
              <span className="text-sm font-bold text-neutral-900">{requesterName}</span>
              <span className="mt-1 text-xs font-medium text-neutral-600">품의</span>
              <span className="text-xs text-neutral-500">{formatDateShort(post.post_date)}</span>
            </div>
            {/* 1차 결재자 */}
            <div className="flex flex-1 flex-col items-center justify-center rounded border border-neutral-300 py-3">
              <span className="text-sm font-bold text-neutral-900">{approver1Name}{approver1Pos && <span className="ml-1 font-medium text-neutral-500">{approver1Pos}</span>}</span>
              <span className={`mt-1 text-sm font-bold ${approver1.approved ? "text-green-600" : "text-red-600"}`}>
                {approver1.approved ? "승인" : "미결재"}
              </span>
              {approver1.date && <span className="text-xs text-neutral-500">{formatDateShort(approver1.date)}</span>}
            </div>
            {/* 최종 결재자 */}
            {post.approver2_mb_id && (
              <div className="flex flex-1 flex-col items-center justify-center rounded border border-neutral-300 py-3">
                <span className="text-sm font-bold text-neutral-900">{approver2Name}{approver2Pos && <span className="ml-1 font-medium text-neutral-500">{approver2Pos}</span>}</span>
                <span className={`mt-1 text-sm font-bold ${approver2.approved ? "text-green-600" : "text-red-600"}`}>
                  {approver2.approved ? "승인" : "미결재"}
                </span>
                {approver2.date && <span className="text-xs text-neutral-500">{formatDateShort(approver2.date)}</span>}
              </div>
            )}
          </div>
        </div>

        {/* 정보 테이블 */}
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b border-neutral-200">
              <td className={labelClass}>작성자명</td>
              <td className={valueClass}>{requesterName}</td>
              <td className={labelClass}>최초작성</td>
              <td className={valueClass}>{formatDateShort(post.post_date)}</td>
              <td className={labelClass}>최종수정</td>
              <td className={valueClass}>{formatDateShort(post.updated_at || post.post_date)}</td>
              <td className={labelClass}>문서번호</td>
              <td className={valueClass}>{post.doc_number || "-"}</td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className={labelClass}>참조부서</td>
              <td className={valueClass} colSpan={3}>
                {refDepts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {refDepts.map((d) => (
                      <span key={d} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">{d}</span>
                    ))}
                  </div>
                ) : "-"}
              </td>
              <td className={labelClass}>참조인원</td>
              <td className={valueClass} colSpan={3}>
                {refMemberIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {refMemberIds.map((id) => (
                      <span key={id} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                        {refNameMap.get(id) || id}
                      </span>
                    ))}
                  </div>
                ) : "-"}
              </td>
            </tr>
            <tr>
              <td className={labelClass}>제목</td>
              <td className={`${valueClass} font-bold`} colSpan={7}>{post.title}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 결재 흐름 (결재요청 후에만) */}
      {post.doc_status === "submitted" && (
        <div className="mt-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-neutral-700">결재 흐름</h3>
            <div className="flex items-start gap-0">
              {/* 청구자 */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">청구</div>
                <p className="mt-1.5 text-xs font-medium text-neutral-700">{requesterName}</p>
                <p className="text-[10px] text-neutral-400">청구자</p>
              </div>
              <div className="mt-5 flex-1 border-t border-dashed border-neutral-300" />
              {/* 1차 결재자 */}
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${approver1.approved ? "bg-green-500" : "bg-neutral-300"}`}>1차</div>
                <p className="mt-1.5 text-xs font-medium text-neutral-700">{approver1Name}</p>
                {approver1.approved ? (
                  <p className="text-[10px] text-green-500">{formatDateTime(approver1.date)}</p>
                ) : (
                  <span className="mt-0.5 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500">대기</span>
                )}
              </div>
              {/* 최종 결재자 */}
              {post.approver2_mb_id && (
                <>
                  <div className="mt-5 flex-1 border-t border-dashed border-neutral-300" />
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${approver2.approved ? "bg-navy" : "bg-neutral-300"}`}>최종</div>
                    <p className="mt-1.5 text-xs font-medium text-neutral-700">{approver2Name}</p>
                    {approver2.approved ? (
                      <p className="text-[10px] text-navy">{formatDateTime(approver2.date)}</p>
                    ) : (
                      <span className="mt-0.5 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500">대기</span>
                    )}
                  </div>
                </>
              )}
              <div className="mt-5 flex-1 border-t border-dashed border-neutral-300" />
              {/* 재정결재 */}
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${finance.approved ? "bg-purple-500" : "bg-neutral-300"}`}>재정</div>
                <p className="mt-1.5 text-xs font-medium text-neutral-700">재정</p>
                {finance.approved ? (
                  <p className="text-[10px] text-purple-500">{formatDateTime(finance.date)}</p>
                ) : (
                  <span className="mt-0.5 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500">대기</span>
                )}
              </div>
              <div className="mt-5 flex-1 border-t border-dashed border-neutral-300" />
              {/* 지급 */}
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${payment.approved ? "bg-accent" : "bg-neutral-300"}`}>지급</div>
                <p className="mt-1.5 text-xs font-medium text-neutral-700">회계</p>
                {payment.approved ? (
                  <p className="text-[10px] text-accent">{formatDateTime(payment.date)}</p>
                ) : (
                  <span className="mt-0.5 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500">미지급</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 관리자: 결재 처리 버튼 */}
      {post.doc_status === "submitted" && (isAdmin || currentUserMbId) && (
        <div className="mt-4">
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
        <div className="mt-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <ApprovalContent content={post.content} />
          </div>
        </div>
      )}

      {/* 세부항목 */}
      {items && items.length > 0 && (
        <div className="mt-4">
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
                      <td className="px-2 py-2 text-right text-neutral-600">{item.quantity?.toLocaleString("ko-KR") ?? "-"}</td>
                      <td className="px-2 py-2 text-right text-neutral-600">{item.unit_price?.toLocaleString("ko-KR") ?? "-"}</td>
                      <td className="px-2 py-2 text-right font-medium text-neutral-700">{item.total_price?.toLocaleString("ko-KR") ?? "-"}</td>
                      <td className="px-2 py-2 text-neutral-500">{item.note || ""}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-neutral-200 bg-neutral-50 font-semibold">
                    <td colSpan={4} className="px-2 py-2 text-right text-neutral-600">합계</td>
                    <td className="px-2 py-2 text-right text-navy">{totalAmount.toLocaleString("ko-KR")}원</td>
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
        <div className="mt-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">첨부파일</h3>
            {files.some((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.original_name || f.file_name)) && (
              <ImagePreviews
                images={files
                  .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.original_name || f.file_name))
                  .map((f) => ({ url: getFileUrl(f.file_name), name: f.original_name || f.file_name }))}
              />
            )}
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
                    <span className="min-w-0 flex-1 truncate">{displayName}</span>
                    <span className="shrink-0 text-xs text-neutral-400">{isImage ? "원본보기" : "다운로드"}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 결재의견 */}
      <div className="mt-4">
        <div className="overflow-hidden border-t border-neutral-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-100">
                <th className="border-b border-neutral-300 px-3 py-2.5 text-center font-semibold text-neutral-700" style={{ width: "50px" }}>번호</th>
                <th className="border-b border-neutral-300 px-3 py-2.5 text-center font-semibold text-neutral-700" style={{ width: "100px" }}>성명</th>
                <th className="border-b border-neutral-300 px-3 py-2.5 text-center font-semibold text-neutral-700" style={{ width: "100px" }}>결재상태</th>
                <th className="border-b border-neutral-300 px-3 py-2.5 text-center font-semibold text-neutral-700">결재의견</th>
                <th className="border-b border-neutral-300 px-3 py-2.5 text-center font-semibold text-neutral-700" style={{ width: "150px" }}>시간</th>
              </tr>
            </thead>
            <tbody>
              {comments && comments.length > 0 ? (
                comments.map((c, i) => (
                  <tr key={c.id} className="border-b border-neutral-200">
                    <td className="px-3 py-2.5 text-center text-neutral-500">{i + 1}</td>
                    <td className="px-3 py-2.5 text-center text-neutral-900">{c.name}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={c.status === "승인취소" ? "text-red-500" : "text-green-600"}>{c.status}</span>
                    </td>
                    <td className="px-3 py-2.5 text-neutral-800">{c.comment || ""}</td>
                    <td className="px-3 py-2.5 text-center text-neutral-500">{formatDateShort(c.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-neutral-400">자료가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
