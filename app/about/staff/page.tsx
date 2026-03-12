import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
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
      <SubpageHeader
        title="교회소개"
        breadcrumbs={[
          { label: "교회소개", href: "/about" },
          { label: "섬기는 사람들" },
        ]}
      />

      <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
        <SubpageSidebar
          title="교회소개"
          items={[
            { label: "인사말씀", href: "/about" },
            { label: "설립목사", href: "/about/founder" },
            { label: "교회연혁", href: "/about/history" },
            { label: "섬기는 사람들", href: "/about/staff" },
            { label: "오시는 길", href: "/about/location" },
          ]}
        />
        <div className="min-w-0 flex-1">
        <StaffWrapper staffList={staffList} isAdmin={isAdmin} />
      </div>
      </div>
    </>
  );
}
