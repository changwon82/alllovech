import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "관리자 | 다애교회" };

export default async function AdminDashboard() {
  const { admin } = await requireAdmin();

  const [usersResult, pendingResult, checksResult, groupsResult] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("bible_checks").select("user_id", { count: "exact", head: true }),
    admin.from("groups").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const stats = [
    { label: "전체 사용자", value: usersResult.count ?? 0 },
    { label: "승인 대기", value: pendingResult.count ?? 0, highlight: true },
    { label: "총 읽기 체크", value: checksResult.count ?? 0 },
    { label: "활성 그룹", value: groupsResult.count ?? 0 },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800">대시보드</h2>
      <div className="mt-1 h-1 w-10 rounded-full bg-accent" />

      <div className="mt-6 grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl p-5 shadow-sm ${
              s.highlight && s.value > 0
                ? "bg-accent-light"
                : "bg-white"
            }`}
          >
            <p className={`text-3xl font-bold ${s.highlight && s.value > 0 ? "text-accent" : "text-neutral-800"}`}>
              {s.value}
            </p>
            <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
