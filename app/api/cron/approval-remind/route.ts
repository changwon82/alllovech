import { NextRequest, NextResponse } from "next/server";
import { sendPendingReminders } from "@/lib/approval-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Vercel Cron 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendPendingReminders();
  return NextResponse.json({ ok: true, ...result });
}
