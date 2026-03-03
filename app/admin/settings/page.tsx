import { requireAdmin } from "@/lib/admin";
import EmailToggle from "./EmailToggle";

export const metadata = { title: "설정 | 관리자 | 다애교회" };

export default async function AdminSettingsPage() {
  const { admin } = await requireAdmin();

  const { data } = await admin
    .from("admin_settings")
    .select("key, value")
    .eq("key", "email_notifications")
    .maybeSingle();

  const emailEnabled = data?.value === "true";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-neutral-800">알림 설정</h2>
      <EmailToggle initialEnabled={emailEnabled} />
    </div>
  );
}
