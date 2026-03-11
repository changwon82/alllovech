import { requireAdmin } from "@/lib/admin";
import VisitDashboard from "./VisitDashboard";

export const metadata = { title: "심방 관리 | 관리자 | 다애교회" };

export default async function VisitsPage() {
  const { admin } = await requireAdmin();

  const [visitsResult, membersResult, scheduledResult, completedResult, followUpResult, suggestedResult] =
    await Promise.all([
      admin
        .from("pastoral_visits")
        .select("*, church_members(id, name, phone, birth_date, gender)")
        .order("visit_date", { ascending: false, nullsFirst: false })
        .limit(200),
      admin
        .from("church_members")
        .select("id, name, phone, birth_date, gender")
        .order("name"),
      admin
        .from("pastoral_visits")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled"),
      admin
        .from("pastoral_visits")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("visit_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
      admin
        .from("pastoral_visits")
        .select("id", { count: "exact", head: true })
        .eq("follow_up_needed", true)
        .eq("status", "completed"),
      admin
        .from("pastoral_visits")
        .select("id", { count: "exact", head: true })
        .eq("status", "suggested"),
    ]);

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800">심방 관리</h2>
      <div className="mt-1 h-1 w-10 rounded-full bg-accent" />
      <div className="mt-6">
        <VisitDashboard
          initialVisits={visitsResult.data ?? []}
          members={membersResult.data ?? []}
          stats={{
            scheduled: scheduledResult.count ?? 0,
            completed: completedResult.count ?? 0,
            followUp: followUpResult.count ?? 0,
            suggested: suggestedResult.count ?? 0,
          }}
        />
      </div>
    </div>
  );
}
