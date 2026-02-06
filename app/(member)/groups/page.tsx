import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";
import { getProfileName } from "@/src/lib/utils";

export const metadata = { title: "소그룹 — alllovech" };

export default async function GroupsPage() {
  const supabase = await createClient();

  const { data: groups, error } = await supabase
    .from("groups")
    .select("id, name, description, leader_id, created_at, profiles(name), group_members(count)")
    .order("created_at", { ascending: false });

  return (
    <Container as="main" className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">소그룹</h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        교회 내 소그룹과 셀 모임입니다.
      </p>

      {error ? (
        <p className="mt-6 text-sm text-red-500">
          데이터를 불러오지 못했습니다.
        </p>
      ) : !groups || groups.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-neutral-400 dark:text-neutral-500">
            등록된 소그룹이 없습니다.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {groups.map((group) => {
            const memberCount =
              group.group_members?.[0]?.count ?? 0;
            return (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="group rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <h2 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                  {group.name}
                </h2>
                {group.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {group.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
                  <span>리더: {getProfileName(group.profiles, "미정")}</span>
                  <span>·</span>
                  <span>{memberCount}명</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
