"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Container from "@/src/components/Container";
import { createClient } from "@/src/lib/supabase/client";
import { ATTENDANCE_STATUS_LABEL } from "@/src/types/database";
import type { RosterMember, Attendance } from "@/src/types/database";

type AttStatus = Attendance["status"];

export default function NewAttendancePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orgId = params.id;

  const [members, setMembers] = useState<RosterMember[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState("");
  const [statuses, setStatuses] = useState<Record<string, AttStatus>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("roster_members")
      .select("*")
      .eq("organization_id", orgId)
      .in("status", ["active", "new"])
      .order("name");
    const activeMembers = data ?? [];
    setMembers(activeMembers);
    // 기본값: 모두 출석
    const defaults: Record<string, AttStatus> = {};
    activeMembers.forEach((m) => { defaults[m.id] = "present"; });
    setStatuses(defaults);
  }, [supabase, orgId]);

  useEffect(() => { load(); }, [load]);

  const cycleStatus = (memberId: string) => {
    const order: AttStatus[] = ["present", "absent", "excused"];
    const current = statuses[memberId] || "present";
    const next = order[(order.indexOf(current) + 1) % order.length];
    setStatuses((prev) => ({ ...prev, [memberId]: next }));
  };

  const statusStyle: Record<AttStatus, string> = {
    present: "bg-green-500 text-white",
    absent: "bg-red-400 text-white",
    excused: "bg-yellow-400 text-neutral-900",
  };

  const handleSave = async () => {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 모임 생성
    const { data: meeting, error: meetingErr } = await supabase
      .from("meetings")
      .insert({
        organization_id: orgId,
        meeting_date: date,
        title,
        created_by: user?.id,
      })
      .select("id")
      .single();

    if (meetingErr || !meeting) {
      alert("모임 생성 실패: " + meetingErr?.message);
      setSaving(false);
      return;
    }

    // 출석 데이터 일괄 삽입
    const rows = members.map((m) => ({
      meeting_id: meeting.id,
      roster_member_id: m.id,
      status: statuses[m.id] || "present",
    }));

    const { error: attErr } = await supabase.from("attendance").insert(rows);

    if (attErr) {
      alert("출석 저장 실패: " + attErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push(`/my-orgs/${orgId}/attendance/${meeting.id}`);
    router.refresh();
  };

  const presentCount = Object.values(statuses).filter((s) => s === "present").length;

  return (
    <Container as="main" className="py-8 sm:py-12">
      <Link href={`/my-orgs/${orgId}/attendance`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← 출석 기록
      </Link>

      <h1 className="mt-4 text-2xl font-bold">새 출석체크</h1>

      {/* 날짜 & 제목 */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">모임 제목 (선택)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 3월 첫째주 셀모임"
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>

      {/* 출석 요약 */}
      <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        출석 {presentCount}/{members.length}명 — 멤버를 탭하여 상태를 변경하세요
      </p>

      {/* 멤버 목록 — 모바일 최적화 */}
      {members.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 py-12 text-center dark:border-neutral-700">
          <p className="text-neutral-400">활성 멤버가 없습니다. 명단을 먼저 추가하세요.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {members.map((m) => {
            const st = statuses[m.id] || "present";
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => cycleStatus(m.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 text-left transition-all active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div>
                    <p className="font-medium">{m.name}</p>
                    {m.status === "new" && (
                      <span className="text-xs text-blue-500">신규</span>
                    )}
                  </div>
                  <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusStyle[st]}`}>
                    {ATTENDANCE_STATUS_LABEL[st]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 저장 */}
      <div className="sticky bottom-4 mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || members.length === 0}
          className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {saving ? "저장 중..." : `출석 저장 (${presentCount}/${members.length}명 출석)`}
        </button>
      </div>
    </Container>
  );
}
