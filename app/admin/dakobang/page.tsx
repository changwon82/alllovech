import { requireAdmin } from "@/lib/admin";
import DakobangClient from "./DakobangClient";

export const metadata = { title: "다코방 조직 | 관리자 | 다애교회" };

export default async function DakobangPage() {
  const { admin } = await requireAdmin();

  const [{ data: groups }, { data: members }] = await Promise.all([
    admin
      .from("dakobang_groups")
      .select("*, dakobang_group_members(id, member_id, role, sort_order, church_members(id, name))")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    admin
      .from("church_members")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800">다코방 조직</h2>
      <div className="mt-1 h-1 w-10 rounded-full bg-accent" />
      <DakobangClient initialGroups={groups ?? []} initialMembers={members ?? []} />
    </div>
  );
}
