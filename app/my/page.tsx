import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
// createAdminClient는 getCachedPushSetting 내부에서 사용
import { isAdminRole } from "@/lib/admin";
import { getUnreadCount } from "@/lib/notifications";
import { extractBooksFromTitle } from "@/app/365bible/plan";
import MyPageContent from "./MyPageContent";
import UserMenu from "@/app/components/UserMenu";
import BottomNav from "@/app/components/BottomNav";
import PushNotificationToggle from "@/app/components/PushNotificationToggle";
import PageHeader from "@/app/components/ui/PageHeader";

export const metadata = { title: "나의기록 | 다애교회" };

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

function makeAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 365일 읽기표 캐시 (bible 페이지와 동일 캐시 키 공유)
const getCachedAllReadings = unstable_cache(
  async () => {
    const { data } = await makeAnonClient()
      .from("bible_readings")
      .select("day, title")
      .order("day");
    return (data ?? []) as { day: number; title: string | null }[];
  },
  ["bible-readings-all"],
  { revalidate: 3600 }
);

// push 설정 캐시 — 1시간
const getCachedPushSetting = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("admin_settings")
      .select("value")
      .eq("key", "push_notifications")
      .maybeSingle();
    return data?.value === "true";
  },
  ["push-setting"],
  { revalidate: 3600 }
);

// 사용자 역할 캐시 — 10분 (user별 캐시 키)
const getCachedUserMeta = unstable_cache(
  async (userId: string) => {
    const admin = createAdminClient();
    const [rolesResult, groupResult] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", userId),
      admin.from("group_members").select("role", { count: "exact", head: true })
        .eq("user_id", userId).in("role", ["leader", "sub_leader"]),
    ]);
    const roles = new Set((rolesResult.data ?? []).map((r: { role: string }) => r.role));
    const isLeader = (groupResult.count ?? 0) > 0;
    return { roles: [...roles], isLeader };
  },
  ["user-meta"],
  { revalidate: 600 }
);

export default async function MyPage() {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    redirect("/login?next=/my");
  }

  const year = getKoreaYear();
  const today = Math.max(1, Math.min(365, getKoreaDayOfYear()));

  const [profileResult, checksResult, reflectionsResult, allReadings, userMeta, unreadCount, showPushToggleValue] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, status, phone, avatar_url")
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
    getCachedAllReadings(),
    getCachedUserMeta(user.id),
    getUnreadCount(supabase, user.id),
    getCachedPushSetting(),
  ]);

  const profile = profileResult.data;
  const checkedDays = (checksResult.data ?? []).map((d: { day: number }) => d.day);
  const reflections = (reflectionsResult.data ?? []) as {
    id: string; day: number; content: string; visibility: string; created_at: string;
  }[];

  // day → 책 이름 배열 매핑
  const dayToBooks: Record<number, string[]> = {};
  for (const r of allReadings) {
    if (r.title) dayToBooks[r.day] = extractBooksFromTitle(r.title);
  }

  const roles = new Set(userMeta.roles);
  const isAdmin = isAdminRole(roles);
  const canViewGroups = isAdmin || userMeta.isLeader;
  const showPushToggle = isAdmin || showPushToggleValue;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20 md:pt-4 md:pb-24">
      <PageHeader
        title="나의기록"
        action={<UserMenu name={profile?.name ?? "이름 없음"} canViewGroups={canViewGroups} />}
      />

      {showPushToggle && (
        <div className="mt-4">
          <PushNotificationToggle />
        </div>
      )}

      <MyPageContent
        userId={user.id}
        name={profile?.name ?? "이름 없음"}
        status={profile?.status ?? "pending"}
        phone={profile?.phone ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        year={year}
        today={today}
        checkedDays={checkedDays}
        reflections={reflections}
        dayToBooks={dayToBooks}
      />

      <BottomNav userId={user.id} isAdmin={isAdmin} canViewGroups={canViewGroups} unreadCount={unreadCount} />
    </div>
  );
}
