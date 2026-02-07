import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import MemberNav from "@/src/components/MemberNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { count: leaderCount } = await supabase
    .from("org_leaders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <>
      <MemberNav
        email={user.email ?? ""}
        name={profile?.name}
        isAdmin={true}
        isLeader={(leaderCount ?? 0) > 0}
      />
      <div className="flex-1">{children}</div>
    </>
  );
}
