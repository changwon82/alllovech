import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole, isGroupLeader } from "@/lib/admin";
import { getUnreadCount } from "@/lib/notifications";
import NotificationList from "./NotificationList";
import UserMenu from "@/app/components/UserMenu";
import BottomNav from "@/app/components/BottomNav";
import PageHeader from "@/app/components/ui/PageHeader";

export const metadata = { title: "알림 | 다애교회" };

export default async function NotificationsPage() {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    redirect("/login?next=/notifications");
  }

  const [profileResult, roles, { data: rawNotifications }, groupLeader, unreadCount] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
    getUserRoles(supabase, user.id),
    supabase
      .from("notifications")
      .select("id, type, actor_id, reference_id, group_id, message, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    isGroupLeader(supabase, user.id),
    getUnreadCount(supabase, user.id),
  ]);

  const userName = profileResult.data?.name ?? "이름 없음";
  const isAdmin = isAdminRole(roles);
  const canViewGroups = isAdmin || groupLeader;

  // actor 이름, reflection day, group 이름 가져오기
  const notifications = rawNotifications ?? [];
  const actorIds = [...new Set(notifications.map((n) => n.actor_id).filter(Boolean))] as string[];
  const reflectionIds = [...new Set(notifications.map((n) => n.reference_id).filter(Boolean))] as string[];
  const groupIds = [...new Set(notifications.map((n) => n.group_id).filter(Boolean))] as string[];

  const actorNames: Record<string, string> = {};
  const reflectionDays: Record<string, number> = {};
  const groupNames: Record<string, string> = {};

  const fetches = await Promise.all([
    actorIds.length > 0 ? supabase.from("profiles").select("id, name").in("id", actorIds) : null,
    reflectionIds.length > 0 ? supabase.from("reflections").select("id, day").in("id", reflectionIds) : null,
    groupIds.length > 0 ? supabase.from("groups").select("id, name").in("id", groupIds) : null,
  ]);
  for (const p of fetches[0]?.data ?? []) actorNames[p.id] = p.name;
  for (const r of fetches[1]?.data ?? []) reflectionDays[r.id] = r.day;
  for (const g of fetches[2]?.data ?? []) groupNames[g.id] = g.name;

  const enrichedNotifications = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    actor_name: n.actor_id ? (actorNames[n.actor_id] ?? null) : null,
    reference_id: n.reference_id,
    message: (n as { message?: string | null }).message ?? null,
    group_name: n.group_id ? (groupNames[n.group_id] ?? null) : null,
    is_read: n.is_read,
    created_at: n.created_at,
    reflection_day: n.reference_id ? (reflectionDays[n.reference_id] ?? null) : null,
  }));

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20 md:pt-4 md:pb-24">
      <PageHeader title="알림" action={<UserMenu name={userName} canViewGroups={canViewGroups} userId={user.id} unreadCount={unreadCount} />} />

      <NotificationList notifications={enrichedNotifications} />

      <BottomNav userId={user.id} isAdmin={isAdmin} canViewGroups={canViewGroups} unreadCount={unreadCount} />
    </div>
  );
}
