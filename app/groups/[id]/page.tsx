import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getUserRoles, isAdminRole } from "@/lib/admin";
import { getUnreadCount } from "@/lib/notifications";
import GroupFeed from "./GroupFeed";
import InviteManager from "./InviteManager";
import UserMenu from "@/app/components/UserMenu";
import BottomNav from "@/app/components/BottomNav";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return { title: group ? `${group.name} | 다애교회` : "소그룹 | 다애교회" };
}

function getKoreaYear(): number {
  return Number(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }).split("-")[0]);
}

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const { supabase, user } = await getSessionUser();

  if (!user) {
    redirect(`/login?next=/groups/${groupId}`);
  }

  // 그룹 정보 + 내 멤버십 + 프로필 + 역할 확인
  const [groupResult, membershipResult, profileResult, roles, unreadCount] = await Promise.all([
    supabase.from("groups").select("id, name, type, description").eq("id", groupId).maybeSingle(),
    supabase.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
    getUserRoles(supabase, user.id),
    getUnreadCount(supabase, user.id),
  ]);

  if (!groupResult.data || !membershipResult.data) {
    notFound();
  }

  const group = groupResult.data;
  const year = getKoreaYear();
  const userName = profileResult.data?.name ?? "이름 없음";
  const isAdmin = isAdminRole(roles);
  const isLeader = membershipResult.data.role === "leader" || membershipResult.data.role === "sub_leader";

  // 리더일 때 기존 초대 코드 조회 (1개만)
  let inviteCode: string | null = null;
  if (isLeader) {
    const { data } = await supabase
      .from("group_invites")
      .select("code")
      .eq("group_id", groupId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    inviteCode = data?.code ?? null;
  }

  // 그룹에 공유된 묵상 피드 (최신순)
  const { data: shares } = await supabase
    .from("reflection_group_shares")
    .select(`
      reflection:reflections (
        id,
        day,
        year,
        content,
        created_at,
        user_id,
        profiles:user_id (name, avatar_url)
      )
    `)
    .eq("group_id", groupId)
    .order("reflection_id", { ascending: false });

  type ReflectionRow = {
    id: string;
    day: number;
    year: number;
    content: string;
    created_at: string;
    user_id: string;
    profiles: { name: string; avatar_url: string | null };
  };

  const reflections = (shares ?? [])
    .map((s) => s.reflection as unknown as ReflectionRow)
    .filter(Boolean)
    .filter((r) => r.year === year);

  // 각 묵상의 댓글 + 아멘 수 + 내 아멘 여부
  const reflectionIds = reflections.map((r) => r.id);

  let commentsMap: Record<string, { id: string; content: string; created_at: string; user_id: string; profiles: { name: string } }[]> = {};
  let amenCounts: Record<string, number> = {};
  let myAmens: Set<string> = new Set();

  if (reflectionIds.length > 0) {
    const [commentsResult, reactionsResult, myReactionsResult] = await Promise.all([
      supabase
        .from("reflection_comments")
        .select("id, reflection_id, content, created_at, user_id, profiles:user_id (name)")
        .in("reflection_id", reflectionIds)
        .order("created_at"),
      supabase
        .from("reflection_reactions")
        .select("reflection_id")
        .in("reflection_id", reflectionIds),
      supabase
        .from("reflection_reactions")
        .select("reflection_id")
        .in("reflection_id", reflectionIds)
        .eq("user_id", user.id),
    ]);

    for (const c of (commentsResult.data ?? []) as unknown as { id: string; reflection_id: string; content: string; created_at: string; user_id: string; profiles: { name: string } }[]) {
      if (!commentsMap[c.reflection_id]) commentsMap[c.reflection_id] = [];
      commentsMap[c.reflection_id].push({ id: c.id, content: c.content, created_at: c.created_at, user_id: c.user_id, profiles: c.profiles });
    }

    for (const r of (reactionsResult.data ?? []) as { reflection_id: string }[]) {
      amenCounts[r.reflection_id] = (amenCounts[r.reflection_id] ?? 0) + 1;
    }

    for (const r of (myReactionsResult.data ?? []) as { reflection_id: string }[]) {
      myAmens.add(r.reflection_id);
    }
  }

  // 그룹 멤버 목록
  const { data: members } = await supabase
    .from("group_members")
    .select("role, user_id, profiles:user_id (name)")
    .eq("group_id", groupId);

  const memberCount = members?.length ?? 0;

  const feedData = reflections.map((r) => ({
    id: r.id,
    day: r.day,
    year: r.year,
    content: r.content,
    created_at: r.created_at,
    authorName: r.profiles?.name ?? "이름 없음",
    authorId: r.user_id,
    comments: commentsMap[r.id] ?? [],
    amenCount: amenCounts[r.id] ?? 0,
    myAmen: myAmens.has(r.id),
  }));

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-3 pb-20 md:pt-4 md:pb-24">
      <div className="mt-2 flex items-center justify-between">
        <div>
          <Link href="/groups" className="text-xs text-neutral-400 hover:text-navy">&larr; 소그룹 목록</Link>
          <h1 className="text-[32px] leading-[40px] font-bold text-navy">{group.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">{memberCount}명</span>
          <UserMenu name={userName} />
        </div>
      </div>
      <div className="mt-2 h-1 w-12 rounded-full bg-accent" />

      {group.description && (
        <p className="mt-3 text-sm text-neutral-500">{group.description}</p>
      )}

      {isLeader && (
        <InviteManager
          groupId={groupId}
          groupName={group.name}
          inviteCode={inviteCode}
        />
      )}

      <GroupFeed
        feed={feedData}
        currentUserId={user.id}
        currentUserName={userName}
        groupId={groupId}
      />

      <BottomNav userId={user.id} isAdmin={isAdmin} unreadCount={unreadCount} />
    </div>
  );
}
