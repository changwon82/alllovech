import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";
import { ATTENDANCE_STATUS_LABEL } from "@/src/types/database";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string; meetingId: string }>;
}) {
  const { id, meetingId } = await params;
  const supabase = await createClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  if (!meeting) notFound();

  const { data: attendanceData } = await supabase
    .from("attendance")
    .select("status, note, roster_members(name, status)")
    .eq("meeting_id", meetingId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attendance = (attendanceData ?? []) as any[];
  const present = attendance.filter((a) => a.status === "present").length;
  const total = attendance.length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  // 보고서 존재 여부
  const { data: report } = await supabase
    .from("meeting_reports")
    .select("id")
    .eq("meeting_id", meetingId)
    .single();

  const statusStyle: Record<string, string> = {
    present: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    absent: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    excused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <Container as="main" className="py-8 sm:py-12">
      <Link href={`/my-orgs/${id}/attendance`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← 출석 기록
      </Link>

      <h1 className="mt-4 text-2xl font-bold">
        {meeting.title || new Date(meeting.meeting_date).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) + " 모임"}
      </h1>
      <time className="mt-1 block text-sm text-neutral-400">
        {new Date(meeting.meeting_date).toLocaleDateString("ko-KR")}
      </time>

      {/* 요약 */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl font-bold">{rate}%</p>
          <p className="text-xs text-neutral-400">출석률</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl font-bold">{present}</p>
          <p className="text-xs text-neutral-400">출석</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl font-bold">{total - present}</p>
          <p className="text-xs text-neutral-400">결석/사유</p>
        </div>
      </div>

      {/* 보고서 링크 */}
      <div className="mt-4">
        {report ? (
          <Link
            href={`/my-orgs/${id}/reports/${report.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            보고서 보기 →
          </Link>
        ) : (
          <Link
            href={`/my-orgs/${id}/reports/new?meetingId=${meetingId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            보고서 작성 →
          </Link>
        )}
      </div>

      {/* 출석 목록 */}
      <ul className="mt-6 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
        {attendance.map((a, i) => {
          const memberName = Array.isArray(a.roster_members)
            ? a.roster_members[0]?.name
            : a.roster_members?.name;
          return (
            <li key={i} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">{memberName || "알 수 없음"}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle[a.status]}`}>
                {ATTENDANCE_STATUS_LABEL[a.status as keyof typeof ATTENDANCE_STATUS_LABEL]}
              </span>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
