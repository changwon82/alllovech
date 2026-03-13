import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import WorshipWrapper from "./WorshipWrapper";

export const metadata = { title: "예배안내 | 다애교회" };

export default async function WorshipPage() {
  const [{ supabase, user }, servicesResult] = await Promise.all([
    getSessionUser(),
    createAdminClient()
      .from("worship_services")
      .select("*")
      .order("sort_order"),
  ]);

  let isAdmin = false;
  if (user) {
    const roles = await getUserRoles(supabase, user.id);
    isAdmin = isAdminRole(roles);
  }

  return (
    <>
      <WorshipWrapper
        services={servicesResult.data ?? []}
        isAdmin={isAdmin}
      />

      {/* 안내 */}
      <div className="mt-10 border border-navy/10 bg-white p-5">
        <h3 className="text-base font-bold text-navy">안내사항</h3>
        <ul className="mt-3 space-y-1.5 text-base text-neutral-600">
          <li className="flex gap-2">
            <span className="shrink-0 text-accent">•</span>
            예배 시간 10분 전까지 입장해 주시기 바랍니다.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-accent">•</span>
            주차안내는{" "}
            <a href="/about/location" className="font-medium text-navy underline underline-offset-2">
              오시는 길
            </a>
            을 참고해 주세요.
          </li>
        </ul>
      </div>
    </>
  );
}
