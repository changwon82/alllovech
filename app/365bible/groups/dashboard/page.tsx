import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { isBibleManager } from "@/lib/admin";
import { getUnreadCount } from "@/lib/notifications";
import UserMenu from "@/app/components/UserMenu";
import BottomNav from "@/app/components/BottomNav";
import PageHeader from "@/app/components/ui/PageHeader";
import ManagerDashboard from "./ManagerDashboard";
import { getDashboardOverview } from "./actions";

export const metadata = { title: "전체 그룹 현황 | 다애교회" };

export default async function ManagerDashboardPage() {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    redirect("/login?next=/365bible/groups/dashboard");
  }

  const isManager = await isBibleManager(supabase, user.id);
  if (!isManager) {
    redirect("/365bible/groups");
  }

  const [profileResult, unreadCount, overview] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
    getUnreadCount(supabase, user.id),
    getDashboardOverview(),
  ]);

  const userName = profileResult.data?.name ?? "이름 없음";

  if ("error" in overview) {
    redirect("/365bible/groups");
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20 md:pt-4 md:pb-24">
      <PageHeader
        title="전체 그룹 현황"
      />

      <ManagerDashboard initialData={overview} />

      <BottomNav userId={user.id} isAdmin={false} canViewGroups unreadCount={unreadCount} />
    </div>
  );
}
