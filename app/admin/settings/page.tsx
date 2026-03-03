import { requireAdmin } from "@/lib/admin";
import EmailToggle from "./EmailToggle";
import PushToggle from "./PushToggle";

export const metadata = { title: "설정 | 관리자 | 다애교회" };

export default async function AdminSettingsPage() {
  const { admin } = await requireAdmin();

  const { data: settings } = await admin
    .from("admin_settings")
    .select("key, value")
    .in("key", ["email_notifications", "push_notifications"]);

  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-neutral-800">알림 설정</h2>
      <PushToggle initialEnabled={settingsMap.push_notifications === "true"} />
      <EmailToggle initialEnabled={settingsMap.email_notifications === "true"} />
    </div>
  );
}
