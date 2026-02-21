import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getInviteByCode } from "@/lib/invite";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const { user } = await getSessionUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${code}/accept`)}`);
  }

  const invite = await getInviteByCode(code);
  if (!invite) {
    redirect("/groups");
  }

  const admin = createAdminClient();

  // 프로필 active로 변경 (pending 상태인 경우)
  await admin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", user.id)
    .eq("status", "pending");

  // 성도(MEMBER) 역할 부여 (없으면 추가)
  await admin
    .from("user_roles")
    .upsert(
      { user_id: user.id, role: "MEMBER" },
      { onConflict: "user_id,role" }
    );

  // 그룹 가입 (중복 방지)
  await admin
    .from("group_members")
    .upsert(
      { group_id: invite.group_id, user_id: user.id, role: "member" },
      { onConflict: "group_id,user_id" }
    );

  redirect(`/groups/${invite.group_id}`);
}
