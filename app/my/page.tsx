import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { getUnreadCount } from "@/lib/notifications";
import MyPageContent from "./MyPageContent";
import UserMenu from "@/app/components/UserMenu";
import BottomNav from "@/app/components/BottomNav";

export const metadata = { title: "내 기록 | 다애교회" };

function getKoreaYear(): number {
  const seoulDateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
  return Number(seoulDateStr.split("-")[0]);
}

function getKoreaDayOfYear(): number {
  const seoulDateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
  const [year, month, day] = seoulDateStr.split("-").map(Number);
  const seoulDate = new Date(year, month - 1, day);
  const yearStart = new Date(year, 0, 0);
  return Math.floor((seoulDate.getTime() - yearStart.getTime()) / 86400000);
}

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/my");
  }

  const year = getKoreaYear();
  const today = Math.max(1, Math.min(365, getKoreaDayOfYear()));

  const [profileResult, checksResult, reflectionsResult, roles, unreadCount] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, status, phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("bible_checks")
      .select("day")
      .eq("user_id", user.id)
      .eq("year", year),
    supabase
      .from("reflections")
      .select("id, day, content, visibility, created_at")
      .eq("user_id", user.id)
      .eq("year", year)
      .order("day", { ascending: false }),
    getUserRoles(supabase, user.id),
    getUnreadCount(supabase, user.id),
  ]);

  const profile = profileResult.data;
  const checkedDays = (checksResult.data ?? []).map((d: { day: number }) => d.day);
  const reflections = (reflectionsResult.data ?? []) as {
    id: string; day: number; content: string; visibility: string; created_at: string;
  }[];
  const isAdmin = isAdminRole(roles);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20 md:pt-4 md:pb-24">
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy md:text-3xl">내 기록</h1>
        <UserMenu name={profile?.name ?? "이름 없음"} />
      </div>
      <div className="mt-2 h-1 w-12 rounded bg-blue" />

      <MyPageContent
        name={profile?.name ?? "이름 없음"}
        status={profile?.status ?? "pending"}
        phone={profile?.phone ?? null}
        year={year}
        today={today}
        checkedDays={checkedDays}
        reflections={reflections}
      />

      <BottomNav userId={user.id} isAdmin={isAdmin} unreadCount={unreadCount} />
    </div>
  );
}
