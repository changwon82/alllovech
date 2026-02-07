import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";

export default async function AttendanceListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, meeting_date, title, attendance(status)")
    .eq("organization_id", id)
    .order("meeting_date", { ascending: false });

  return (
    <Container as="main" className="py-8 sm:py-12">
      <Link href={`/my-orgs/${id}`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← 조직 상세
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">출석 기록</h1>
        <Link
          href={`/my-orgs/${id}/attendance/new`}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          새 출석체크
        </Link>
      </div>

      {!meetings || meetings.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400 dark:text-neutral-500">기록된 모임이 없습니다.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {meetings.map((m) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const att = (m.attendance ?? []) as any[];
            const present = att.filter((a) => a.status === "present").length;
            const total = att.length;
            const rate = total > 0 ? Math.round((present / total) * 100) : 0;

            return (
              <li key={m.id}>
                <Link
                  href={`/my-orgs/${id}/attendance/${m.id}`}
                  className="group flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div>
                    <p className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                      {m.title || new Date(m.meeting_date).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) + " 모임"}
                    </p>
                    <time className="text-sm text-neutral-400 dark:text-neutral-500">
                      {new Date(m.meeting_date).toLocaleDateString("ko-KR")}
                    </time>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{rate}%</p>
                    <p className="text-xs text-neutral-400">{present}/{total}명</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
