import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/notifications";
import UserMenu from "./UserMenu";

export default async function TopNavUser() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileName: string | null = null;
  let avatarUrl: string | null = null;
  let unreadCount = 0;
  if (user) {
    const [profileResult, count] = await Promise.all([
      supabase.from("profiles").select("name, avatar_url").eq("id", user.id).maybeSingle(),
      getUnreadCount(supabase, user.id),
    ]);
    profileName = profileResult.data?.name ?? null;
    avatarUrl = profileResult.data?.avatar_url ?? null;
    unreadCount = count;
  }

  return user ? (
    <UserMenu name={profileName ?? "마이페이지"} avatarUrl={avatarUrl} userId={user.id} unreadCount={unreadCount} />
  ) : (
    <>
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="flex items-center gap-1 text-[13px] font-medium text-neutral-500 transition hover:text-navy">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
        </svg>
        로그인
      </Link>
      <Link href="/signup" className="flex items-center gap-1 text-[13px] font-medium text-neutral-500 transition hover:text-navy">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        회원가입
      </Link>
    </>
  );
}
