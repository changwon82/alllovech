"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Container from "@/src/components/Container";
import { createClient } from "@/src/lib/supabase/client";

export default function NewReportPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const orgId = params.id;
  const preselectedMeetingId = searchParams.get("meetingId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingId, setMeetingId] = useState(preselectedMeetingId || "");
  const [content, setContent] = useState("");
  const [newVisitors, setNewVisitors] = useState(0);
  const [returningCount, setReturningCount] = useState(0);
  const [prayerRequests, setPrayerRequests] = useState("");
  const [saving, setSaving] = useState(false);

  // 출석 요약 자동 계산
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, total: 0 });

  const loadMeetings = useCallback(async () => {
    // 보고서가 아직 없는 모임만 표시
    const { data } = await supabase
      .from("meetings")
      .select("id, meeting_date, title")
      .eq("organization_id", orgId)
      .order("meeting_date", { ascending: false });

    const { data: existingReports } = await supabase
      .from("meeting_reports")
      .select("meeting_id");

    const reportedIds = new Set((existingReports ?? []).map((r) => r.meeting_id));
    const available = (data ?? []).filter((m) => !reportedIds.has(m.id));

    // preselected가 있으면 포함시키기
    if (preselectedMeetingId && !available.find((m) => m.id === preselectedMeetingId)) {
      const match = (data ?? []).find((m) => m.id === preselectedMeetingId);
      if (match) available.unshift(match);
    }

    setMeetings(available);

    if (preselectedMeetingId) {
      setMeetingId(preselectedMeetingId);
    }
  }, [supabase, orgId, preselectedMeetingId]);

  const loadAttendance = useCallback(async () => {
    if (!meetingId) {
      setAttendanceSummary({ present: 0, total: 0 });
      return;
    }
    const { data } = await supabase
      .from("attendance")
      .select("status")
      .eq("meeting_id", meetingId);
    const att = data ?? [];
    setAttendanceSummary({
      present: att.filter((a) => a.status === "present").length,
      total: att.length,
    });
  }, [supabase, meetingId]);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);
  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("meeting_reports")
      .insert({
        meeting_id: meetingId,
        content,
        new_visitors: newVisitors,
        returning_count: returningCount,
        prayer_requests: prayerRequests,
      })
      .select("id")
      .single();

    if (error) {
      alert("보고서 작성 실패: " + error.message);
      setSaving(false);
      return;
    }

    router.push(`/my-orgs/${orgId}/reports/${data.id}`);
    router.refresh();
  };

  const rate = attendanceSummary.total > 0
    ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100)
    : 0;

  return (
    <Container as="main" className="py-8 sm:py-12">
      <Link href={`/my-orgs/${orgId}/reports`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← 보고서 목록
      </Link>

      <h1 className="mt-4 text-2xl font-bold">보고서 작성</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* 모임 선택 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">모임 선택</label>
          <select
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            required
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">모임을 선택하세요</option>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title || new Date(m.meeting_date).toLocaleDateString("ko-KR")}
                {" — "}
                {new Date(m.meeting_date).toLocaleDateString("ko-KR")}
              </option>
            ))}
          </select>
        </div>

        {/* 출석 요약 (자동) */}
        {meetingId && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
            <p className="text-sm font-medium">출석 요약 (자동 계산)</p>
            <p className="mt-1 text-lg font-bold">
              {attendanceSummary.present}/{attendanceSummary.total}명 출석 ({rate}%)
            </p>
          </div>
        )}

        {/* 신규/복귀 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">신규 방문자</label>
            <input
              type="number"
              min={0}
              value={newVisitors}
              onChange={(e) => setNewVisitors(Number(e.target.value))}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">복귀자</label>
            <input
              type="number"
              min={0}
              value={returningCount}
              onChange={(e) => setReturningCount(Number(e.target.value))}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </div>

        {/* 메모 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">모임 소감/메모</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        {/* 기도제목 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">기도제목</label>
          <textarea
            value={prayerRequests}
            onChange={(e) => setPrayerRequests(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !meetingId}
          className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {saving ? "저장 중..." : "보고서 제출"}
        </button>
      </form>
    </Container>
  );
}
