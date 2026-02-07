import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";

export default async function ReportsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 조직의 모임 → 모임에 연결된 보고서 조회
  const { data: orgMeetings } = await supabase
    .from("meetings")
    .select("id, meeting_date, title, meeting_reports(id, content, new_visitors, returning_count, created_at)")
    .eq("organization_id", id)
    .order("meeting_date", { ascending: false });

  const reportsWithMeeting = (orgMeetings ?? [])
    .filter((m) => {
      const rep = Array.isArray(m.meeting_reports) ? m.meeting_reports : [m.meeting_reports];
      return rep.length > 0 && rep[0]?.id;
    })
    .map((m) => {
      const rep = Array.isArray(m.meeting_reports) ? m.meeting_reports[0] : m.meeting_reports;
      return { ...rep, meeting_date: m.meeting_date, meeting_title: m.title, meeting_id: m.id };
    });

  return (
    <Container as="main" className="py-8 sm:py-12">
      <Link href={`/my-orgs/${id}`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← 조직 상세
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">보고서</h1>
        <Link
          href={`/my-orgs/${id}/reports/new`}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          보고서 작성
        </Link>
      </div>

      {reportsWithMeeting.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400 dark:text-neutral-500">작성된 보고서가 없습니다.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {reportsWithMeeting.map((r) => (
            <li key={r.id}>
              <Link
                href={`/my-orgs/${id}/reports/${r.id}`}
                className="group block rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <p className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                  {r.meeting_title || new Date(r.meeting_date).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) + " 보고서"}
                </p>
                <div className="mt-1 flex items-center gap-3 text-sm text-neutral-400 dark:text-neutral-500">
                  <time>{new Date(r.meeting_date).toLocaleDateString("ko-KR")}</time>
                  {r.new_visitors > 0 && <span>신규 {r.new_visitors}명</span>}
                </div>
                {r.content && (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">{r.content}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
