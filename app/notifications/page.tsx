import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import NotificationList from "./NotificationList";
import UserMenu from "@/app/components/UserMenu";
import BottomNav from "@/app/components/BottomNav";

export const metadata = { title: "알림 | 다애교회" };

export default async function NotificationsPage() {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    redirect("/login?next=/notifications");
  }

  const [profileResult, roles, { data: rawNotifications }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
    getUserRoles(supabase, user.id),
    supabase
      .from("notifications")
      .select("id, type, actor_id, reference_id, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const userName = profileResult.data?.name ?? "이름 없음";
  const isAdmin = isAdminRole(roles);

  // actor 이름과 reflection day 가져오기
  const notifications = rawNotifications ?? [];
  const actorIds = [...new Set(notifications.map((n) => n.actor_id).filter(Boolean))] as string[];
  const reflectionIds = [...new Set(notifications.map((n) => n.reference_id).filter(Boolean))] as string[];

  let actorNames: Record<string, string> = {};
  let reflectionDays: Record<string, number> = {};

  if (actorIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", actorIds);
    for (const p of data ?? []) {
      actorNames[p.id] = p.name;
    }
  }

  if (reflectionIds.length > 0) {
    const { data } = await supabase
      .from("reflections")
      .select("id, day")
      .in("id", reflectionIds);
    for (const r of data ?? []) {
      reflectionDays[r.id] = r.day;
    }
  }

  const enrichedNotifications = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    actor_name: n.actor_id ? (actorNames[n.actor_id] ?? null) : null,
    reference_id: n.reference_id,
    is_read: n.is_read,
    created_at: n.created_at,
    reflection_day: n.reference_id ? (reflectionDays[n.reference_id] ?? null) : null,
  }));

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20 md:pt-4 md:pb-24">
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy md:text-3xl">알림</h1>
        <UserMenu name={userName} />
      </div>
      <div className="mt-2 h-1 w-12 rounded bg-blue" />

      <NotificationList notifications={enrichedNotifications} />

      <BottomNav userId={user.id} isAdmin={isAdmin} />
    </div>
  );
}
