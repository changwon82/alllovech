import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
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
      <SubpageHeader
        title="예배와 말씀"
        breadcrumbs={[
          { label: "예배와 말씀", href: "/sermon" },
          { label: "예배안내" },
        ]}
      />

      <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
        <SubpageSidebar
          title="예배와 말씀"
          items={[
            { label: "예배영상", href: "/sermon" },
            { label: "유튜브 채널", href: "https://www.youtube.com/@alllovechurch", external: true, icon: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-red-500" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
            { label: "365 성경읽기", href: "/365bible" },
            { label: "예배안내", href: "/worship" },
          ]}
        />
        <div className="min-w-0 flex-1">
          <WorshipWrapper
            services={servicesResult.data ?? []}
            isAdmin={isAdmin}
          />

          {/* 안내 */}
          <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-5">
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
        </div>
      </div>
    </>
  );
}
