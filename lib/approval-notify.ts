import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

// ── SMTP (Naver) ──
const transporter = nodemailer.createTransport({
  host: "smtp.naver.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NAVER_SMTP_ID!,
    pass: process.env.NAVER_SMTP_PW!,
  },
});

const FROM_EMAIL = `다애교회재정 <${process.env.NAVER_SMTP_ID}@naver.com>`;
const SITE_URL = "https://alllovechurch.org";

// 관리자 수신 이메일
const ADMIN_EMAILS = ["onlytop81@gmail.com", "xljang@gmail.com"];
const BUILDING_ADMIN_EMAIL = "kissarr@naver.com";

// ── Pushbullet SMS ──
const PB_TOKEN = process.env.PUSHBULLET_TOKEN!;
const PB_DEVICE = process.env.PUSHBULLET_DEVICE!;

async function sendSMS(phoneNumber: string, message: string) {
  if (!PB_TOKEN || !PB_DEVICE) return;
  // '#' prefix = SMS 가능 번호
  const cleanPhone = phoneNumber.replace(/^#/, "");
  try {
    await fetch("https://api.pushbullet.com/v2/texts", {
      method: "POST",
      headers: {
        "Access-Token": PB_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          target_device_iden: PB_DEVICE,
          addresses: [cleanPhone],
          message,
        },
      }),
    });
  } catch (e) {
    console.error("[SMS] 전송 실패:", e);
  }
}

async function sendEmail(to: string | string[], subject: string, html: string) {
  const recipients = Array.isArray(to) ? to : [to];
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipients.join(", "),
      subject,
      html,
    });
  } catch (e) {
    console.error("[Email] 전송 실패:", e);
  }
}

// ── 이메일 본문 생성 ──
function buildEmailBody({
  title,
  statusLabel,
  actorName,
  actorPosition,
  nextName,
  nextPosition,
  nextEmail,
  docNumber,
  postId,
  comment,
  message,
}: {
  title: string;
  statusLabel: string;
  actorName: string;
  actorPosition?: string;
  nextName?: string;
  nextPosition?: string;
  nextEmail?: string;
  docNumber: number | null;
  postId: number;
  comment?: string;
  message?: string;
}) {
  const actorLabel = actorPosition ? `${actorName} ${actorPosition}` : actorName;
  const nextLabel = nextName
    ? nextPosition
      ? `${nextName} ${nextPosition}`
      : nextName
    : "";
  const docLink = `${SITE_URL}/approval/${postId}`;

  let html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#333;">`;
  html += `<p style="font-size:16px;font-weight:bold;margin-bottom:12px;">다애교회 재정청구 알림</p>`;
  html += `<table style="border-collapse:collapse;width:100%;max-width:500px;">`;
  html += `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;width:100px;">문서제목</td><td style="padding:6px 12px;">${title}</td></tr>`;
  html += `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">결재${statusLabel}</td><td style="padding:6px 12px;">${actorLabel}</td></tr>`;
  if (nextLabel) {
    html += `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">다음결재</td><td style="padding:6px 12px;">${nextLabel}${nextEmail ? ` (${nextEmail})` : ""}</td></tr>`;
  }
  if (docNumber) {
    html += `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">문서번호</td><td style="padding:6px 12px;">${docNumber}</td></tr>`;
  }
  html += `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:bold;">문서링크</td><td style="padding:6px 12px;"><a href="${docLink}">${docLink}</a></td></tr>`;
  html += `</table>`;
  if (comment) {
    html += `<p style="margin-top:12px;"><strong>결재의견:</strong> ${comment}</p>`;
  }
  if (message) {
    html += `<p style="margin-top:12px;">${message}</p>`;
  }
  html += `<p style="margin-top:16px;font-size:12px;color:#888;">* 문서링크를 누르면 바로 결재가 가능합니다.</p>`;
  html += `</div>`;
  return html;
}

// ── 결재 멤버 정보 조회 ──
async function getMemberInfo(mbId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("approval_members")
    .select("mb_id, name, position, mb_email, mb_hp")
    .eq("mb_id", mbId)
    .maybeSingle();
  return data;
}

// ── 결재 상태 변경 시 알림 ──
export async function notifyApprovalAction({
  postId,
  field,
  action,
  actorMbId,
  comment,
}: {
  postId: number;
  field: "approver1_status" | "approver2_status" | "finance_status" | "payment_status";
  action: "approve" | "reject" | "execute";
  actorMbId: string;
  comment?: string;
}) {
  const admin = createAdminClient();

  // 게시글 정보
  const { data: post } = await admin
    .from("approval_posts")
    .select("title, doc_number, doc_category, requester_mb_id, approver1_mb_id, approver2_mb_id")
    .eq("id", postId)
    .single();
  if (!post) return;

  // 결재자 정보 조회
  const allMbIds = [post.requester_mb_id, post.approver1_mb_id, post.approver2_mb_id, actorMbId].filter(Boolean) as string[];
  const uniqueIds = [...new Set(allMbIds)];
  const { data: allMembers } = await admin
    .from("approval_members")
    .select("mb_id, name, position, mb_email, mb_hp")
    .in("mb_id", uniqueIds);

  const memberMap = new Map((allMembers || []).map((m) => [m.mb_id, m]));
  const actor = memberMap.get(actorMbId);
  const actorName = actor?.name || "관리자";
  const actorPosition = actor?.position || "";

  const statusLabels: Record<string, string> = {
    approve: "승인",
    reject: "반려",
    execute: "집행완료",
  };
  const statusLabel = statusLabels[action] || action;
  const subject = `${actorName}님이 결재를 ${statusLabel}하였습니다.`;

  // ── 1. 승인 (approve) → 다음 결재자에게 이메일 + SMS ──
  if (action === "approve") {
    let nextMbId: string | null = null;

    if (field === "approver1_status" && post.approver2_mb_id) {
      // 1차 승인 → 2차 결재자
      nextMbId = post.approver2_mb_id;
    }
    // 2차 승인, 재정, 지급은 다음 결재자 없음 (관리자에게만)

    if (nextMbId) {
      const next = memberMap.get(nextMbId);
      if (next?.mb_email) {
        const html = buildEmailBody({
          title: post.title,
          statusLabel,
          actorName,
          actorPosition,
          nextName: next.name,
          nextPosition: next.position,
          nextEmail: next.mb_email,
          docNumber: post.doc_number,
          postId,
          comment,
        });
        sendEmail(next.mb_email, subject, html).catch(() => {});
      }

      // SMS: '#'로 시작하는 전화번호만
      if (next?.mb_hp?.startsWith("#")) {
        const smsMsg = `[${post.doc_number || postId}] ${post.title} 결재 요청 \n - ${actorName}`;
        sendSMS(next.mb_hp, smsMsg).catch(() => {});
      }
    }
  }

  // ── 2. 반려 (reject) → 작성자 + 이전 결재자에게 이메일 ──
  if (action === "reject") {
    const recipients: string[] = [];

    // 작성자
    const requester = memberMap.get(post.requester_mb_id);
    if (requester?.mb_email) recipients.push(requester.mb_email);

    // 2차가 반려한 경우 → 1차 결재자에게도
    if (field === "approver2_status" && post.approver1_mb_id) {
      const a1 = memberMap.get(post.approver1_mb_id);
      if (a1?.mb_email) recipients.push(a1.mb_email);
    }

    if (recipients.length > 0) {
      const html = buildEmailBody({
        title: post.title,
        statusLabel,
        actorName,
        actorPosition,
        docNumber: post.doc_number,
        postId,
        comment,
        message: "결재가 반려되었습니다. 반려 의견을 확인 바랍니다.",
      });
      sendEmail(recipients, subject, html).catch(() => {});
    }
  }

  // ── 3. 집행 (execute) → 작성자 + 모든 결재자에게 이메일 ──
  if (action === "execute") {
    const recipients: string[] = [];
    const requester = memberMap.get(post.requester_mb_id);
    if (requester?.mb_email) recipients.push(requester.mb_email);
    const a1 = memberMap.get(post.approver1_mb_id);
    if (a1?.mb_email) recipients.push(a1.mb_email);
    if (post.approver2_mb_id) {
      const a2 = memberMap.get(post.approver2_mb_id);
      if (a2?.mb_email) recipients.push(a2.mb_email);
    }

    if (recipients.length > 0) {
      const html = buildEmailBody({
        title: post.title,
        statusLabel,
        actorName,
        actorPosition,
        docNumber: post.doc_number,
        postId,
        comment,
        message: field === "payment_status"
          ? "집행이 완료되었습니다. 집행 의견을 확인 바랍니다."
          : undefined,
      });
      sendEmail(recipients, subject, html).catch(() => {});
    }
  }

  // ── 4. 관리자에게 항상 이메일 ──
  const adminRecipients = [...ADMIN_EMAILS];
  if (post.doc_category === "건축재정청구") {
    adminRecipients.push(BUILDING_ADMIN_EMAIL);
  }
  const adminHtml = buildEmailBody({
    title: post.title,
    statusLabel,
    actorName,
    actorPosition,
    docNumber: post.doc_number,
    postId,
    comment,
  });
  sendEmail(adminRecipients, subject, adminHtml).catch(() => {});
}

// ── 미결재 독촉 알림 (Cron용) ──
export async function sendPendingReminders() {
  const admin = createAdminClient();

  // 1차 결재 미결재 건수 (결재요청된 문서 중 approver1_status가 미결재)
  const { data: pending1 } = await admin
    .from("approval_posts")
    .select("id, title, doc_number, approver1_mb_id")
    .eq("doc_status", "submitted")
    .or("approver1_status.is.null,approver1_status.eq.0|0");

  // 결재자별 미결재 건수 집계
  const approver1Counts: Record<string, number> = {};
  for (const p of pending1 || []) {
    if (p.approver1_mb_id) {
      approver1Counts[p.approver1_mb_id] = (approver1Counts[p.approver1_mb_id] || 0) + 1;
    }
  }

  // 2차 결재 미결재 건수 (1차가 승인된 후)
  const { data: pending2 } = await admin
    .from("approval_posts")
    .select("id, title, doc_number, approver2_mb_id, approver1_status")
    .eq("doc_status", "submitted")
    .not("approver2_mb_id", "is", null)
    .or("approver2_status.is.null,approver2_status.eq.0|0");

  const approver2Counts: Record<string, number> = {};
  for (const p of pending2 || []) {
    // 1차가 승인된 것만
    if (p.approver1_status && p.approver1_status.startsWith("1|") && p.approver2_mb_id) {
      approver2Counts[p.approver2_mb_id] = (approver2Counts[p.approver2_mb_id] || 0) + 1;
    }
  }

  // 결재자 정보 조회
  const allApproverIds = [...new Set([...Object.keys(approver1Counts), ...Object.keys(approver2Counts)])];
  if (allApproverIds.length === 0) return { sent: 0 };

  const { data: approvers } = await admin
    .from("approval_members")
    .select("mb_id, name, mb_hp, mb_email")
    .in("mb_id", allApproverIds);

  let sentCount = 0;
  for (const approver of approvers || []) {
    const count1 = approver1Counts[approver.mb_id] || 0;
    const count2 = approver2Counts[approver.mb_id] || 0;
    const totalCount = count1 + count2;

    if (totalCount === 0) continue;

    // SMS 독촉
    if (approver.mb_hp?.startsWith("#")) {
      const msg = `다애교회 재정청구 미결재 ${totalCount}건이 있습니다.\n결재 부탁드립니다.`;
      await sendSMS(approver.mb_hp, msg);
      sentCount++;
    }

    // 이메일 독촉
    if (approver.mb_email) {
      const html = `
        <div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#333;">
          <p style="font-size:16px;font-weight:bold;">다애교회 재정청구 미결재 알림</p>
          <p>${approver.name}님, 미결재 문서 <strong>${totalCount}건</strong>이 있습니다.</p>
          <p>결재 부탁드립니다.</p>
          <p><a href="${SITE_URL}/approval">결재 목록 바로가기</a></p>
        </div>
      `;
      await sendEmail(approver.mb_email, `다애교회 재정청구 미결재 ${totalCount}건`, html);
      sentCount++;
    }
  }

  return { sent: sentCount };
}
