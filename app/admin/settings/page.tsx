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
    <div>
      <h2 className="text-xl font-bold text-neutral-800">설정</h2>
      <div className="mt-1 h-1 w-10 rounded-full bg-accent" />
      <div className="mt-6 space-y-4">
        <h3 className="text-base font-semibold text-neutral-700">알림 설정</h3>
        <PushToggle initialEnabled={settingsMap.push_notifications === "true"} />
        <EmailToggle initialEnabled={settingsMap.email_notifications === "true"} />
      </div>
    </div>
  );
}
