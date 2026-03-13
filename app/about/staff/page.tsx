import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import StaffWrapper from "./StaffWrapper";

export const metadata = { title: "섬기는 사람들 | 다애교회" };

export default async function StaffPage() {
  const [{ supabase, user }, staffResult] = await Promise.all([
    getSessionUser(),
    createAdminClient()
      .from("staff")
      .select("*")
      .order("sort_order"),
  ]);

  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  const staffList = staffResult.data ?? [];

  return (
    <>
        <StaffWrapper staffList={staffList} isAdmin={isAdmin} />
    </>
  );
}
