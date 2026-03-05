import { requireAdmin } from "@/lib/admin";
import MemberList from "./MemberList";

export const metadata = { title: "교인명단 | 관리자 | 다애교회" };

export default async function MembersPage() {
  const { admin } = await requireAdmin();

  const { data: members } = await admin
    .from("church_members")
    .select("id, name, gender, birth_date, phone, dakobang_group_members(role, dakobang_groups(name))")
    .order("name", { ascending: true });

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800">교인명단</h2>
      <div className="mt-1 h-1 w-10 rounded-full bg-accent" />
      <div className="mt-6">
        <MemberList initialMembers={members ?? []} />
      </div>
    </div>
  );
}
