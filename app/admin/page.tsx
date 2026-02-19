import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "관리자 | 다애교회" };

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();

  const [usersResult, pendingResult, checksResult, groupsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("bible_checks").select("user_id", { count: "exact", head: true }),
    supabase.from("groups").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const stats = [
    { label: "전체 사용자", value: usersResult.count ?? 0 },
    { label: "승인 대기", value: pendingResult.count ?? 0, highlight: true },
    { label: "총 읽기 체크", value: checksResult.count ?? 0 },
    { label: "활성 그룹", value: groupsResult.count ?? 0 },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-4 ${
              s.highlight && s.value > 0
                ? "border-blue/30 bg-blue/5"
                : "border-neutral-200 bg-neutral-50"
            }`}
          >
            <p className={`text-2xl font-bold ${s.highlight && s.value > 0 ? "text-blue" : "text-neutral-800"}`}>
              {s.value}
            </p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
