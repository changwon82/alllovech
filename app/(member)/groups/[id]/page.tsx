import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import Container from "@/src/components/Container";
import { getProfileName } from "@/src/lib/utils";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("*, profiles(name)")
    .eq("id", id)
    .single();

  if (!group) notFound();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, joined_at, profiles(name)")
    .eq("group_id", id);

  return (
    <Container as="main" className="py-8 sm:py-12">
      <Link
        href="/groups"
        className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
      >
        ← 소그룹 목록
      </Link>

      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{group.name}</h1>
      {group.description && (
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          {group.description}
        </p>
      )}
      <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
        리더: {getProfileName(group.profiles, "미정")}
      </p>

      {/* 멤버 목록 */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">멤버</h2>
        {!members || members.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400 dark:text-neutral-500">
            아직 멤버가 없습니다.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-medium">
                  {getProfileName(m.profiles, "이름 없음")}
                </span>
                <time className="text-xs text-neutral-400 dark:text-neutral-500">
                  {new Date(m.joined_at).toLocaleDateString("ko-KR")} 가입
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
