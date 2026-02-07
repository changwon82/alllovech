import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";
import { ORG_TYPE_LABEL, ROSTER_STATUS_LABEL } from "@/src/types/database";

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (!org) {
    return (
      <Container as="main" className="py-12">
        <p className="text-neutral-400">조직을 찾을 수 없습니다.</p>
      </Container>
    );
  }

  const [rosterRes, meetingsRes] = await Promise.all([
    supabase
      .from("roster_members")
      .select("*")
      .eq("organization_id", id)
      .order("name"),
    supabase
      .from("meetings")
      .select("id, meeting_date, title")
      .eq("organization_id", id)
      .order("meeting_date", { ascending: false })
      .limit(5),
  ]);

  const roster = rosterRes.data ?? [];
  const meetings = meetingsRes.data ?? [];
  const activeCount = roster.filter((m) => m.status === "active").length;

  return (
    <Container as="main" className="py-8 sm:py-12">
      <Link href="/my-orgs" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← 내 조직
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{org.name}</h1>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {ORG_TYPE_LABEL[org.type as keyof typeof ORG_TYPE_LABEL]}
        </span>
      </div>

      {/* 빠른 액션 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href={`/my-orgs/${id}/roster`} className="rounded-xl border border-neutral-200 bg-white p-4 text-center transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl font-bold">{roster.length}</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">명단 관리</p>
        </Link>
        <Link href={`/my-orgs/${id}/attendance/new`} className="rounded-xl border border-neutral-200 bg-white p-4 text-center transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">출석체크</p>
        </Link>
        <Link href={`/my-orgs/${id}/attendance`} className="rounded-xl border border-neutral-200 bg-white p-4 text-center transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl font-bold">{meetings.length}</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">출석 기록</p>
        </Link>
        <Link href={`/my-orgs/${id}/reports`} className="rounded-xl border border-neutral-200 bg-white p-4 text-center transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-2xl">📋</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">보고서</p>
        </Link>
      </div>

      {/* 명단 미리보기 */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">명단</h2>
          <Link href={`/my-orgs/${id}/roster`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
            관리 →
          </Link>
        </div>
        {roster.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400">명단이 비어 있습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {roster.slice(0, 10).map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium">{m.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  m.status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : m.status === "new"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                }`}>
                  {ROSTER_STATUS_LABEL[m.status as keyof typeof ROSTER_STATUS_LABEL]}
                </span>
              </li>
            ))}
            {roster.length > 10 && (
              <li className="px-4 py-2.5 text-center text-sm text-neutral-400">
                외 {roster.length - 10}명
              </li>
            )}
          </ul>
        )}
      </section>

      {/* 최근 모임 */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 모임</h2>
          <Link href={`/my-orgs/${id}/attendance`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
            전체 →
          </Link>
        </div>
        {meetings.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400">기록된 모임이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {meetings.map((m) => (
              <li key={m.id}>
                <Link href={`/my-orgs/${id}/attendance/${m.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <span className="text-sm font-medium">{m.title || new Date(m.meeting_date).toLocaleDateString("ko-KR")}</span>
                  <time className="text-xs text-neutral-400">{new Date(m.meeting_date).toLocaleDateString("ko-KR")}</time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
