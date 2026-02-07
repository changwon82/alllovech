import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string; reportId: string }>;
}) {
  const { id, reportId } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("meeting_reports")
    .select("*, meetings(meeting_date, title, organization_id)")
    .eq("id", reportId)
    .single();

  if (!report) notFound();

  const meetingObj = Array.isArray(report.meetings) ? report.meetings[0] : report.meetings;

  // 출석 요약
  const { data: attendance } = await supabase
    .from("attendance")
    .select("status")
    .eq("meeting_id", report.meeting_id);

  const att = attendance ?? [];
  const present = att.filter((a) => a.status === "present").length;
  const total = att.length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <Container as="main" className="py-8 sm:py-12">
      <Link href={`/my-orgs/${id}/reports`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← 보고서 목록
      </Link>

      <h1 className="mt-4 text-2xl font-bold">
        {meetingObj?.title || new Date(meetingObj?.meeting_date).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} 보고서
      </h1>
      <time className="mt-1 block text-sm text-neutral-400">
        {meetingObj?.meeting_date && new Date(meetingObj.meeting_date).toLocaleDateString("ko-KR")}
      </time>

      {/* 출석 요약 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl font-bold">{rate}%</p>
          <p className="text-xs text-neutral-400">출석률</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl font-bold">{present}/{total}</p>
          <p className="text-xs text-neutral-400">출석</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl font-bold">{report.new_visitors}</p>
          <p className="text-xs text-neutral-400">신규 방문</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl font-bold">{report.returning_count}</p>
          <p className="text-xs text-neutral-400">복귀자</p>
        </div>
      </div>

      {/* 내용 */}
      {report.content && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">모임 소감</h2>
          <p className="mt-2 whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
            {report.content}
          </p>
        </section>
      )}

      {report.prayer_requests && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">기도제목</h2>
          <p className="mt-2 whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
            {report.prayer_requests}
          </p>
        </section>
      )}

      {/* 출석 상세 링크 */}
      <div className="mt-8">
        <Link
          href={`/my-orgs/${id}/attendance/${report.meeting_id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          출석 상세 보기 →
        </Link>
      </div>
    </Container>
  );
}
