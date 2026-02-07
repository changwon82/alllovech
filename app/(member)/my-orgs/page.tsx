import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";
import { ORG_TYPE_LABEL, ORG_ROLE_LABEL } from "@/src/types/database";

export const metadata = { title: "내 조직 — All Love Church" };

export default async function MyOrgsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myLeaderships } = await supabase
    .from("org_leaders")
    .select("role, organizations(id, name, type, description)")
    .eq("user_id", user!.id);

  const orgs = (myLeaderships ?? []).map((l) => {
    const org = Array.isArray(l.organizations) ? l.organizations[0] : l.organizations;
    return { ...org, leaderRole: l.role };
  }).filter((o) => o?.id);

  return (
    <Container as="main" className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">내 조직</h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        내가 담당하는 소그룹, 부서, 예배 조직입니다.
      </p>

      {orgs.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400 dark:text-neutral-500">
            담당 조직이 없습니다.
          </p>
          <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
            관리자에게 조직 배정을 요청하세요.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/my-orgs/${org.id}`}
              className="group block rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md sm:p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-2">
                <h2 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                  {org.name}
                </h2>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {ORG_TYPE_LABEL[org.type as keyof typeof ORG_TYPE_LABEL]}
                </span>
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {ORG_ROLE_LABEL[org.leaderRole as keyof typeof ORG_ROLE_LABEL]}
                </span>
              </div>
              {org.description && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {org.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
