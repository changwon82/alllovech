import { getSessionUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/app/components/ui/PageHeader";
import BottomNav from "@/app/components/BottomNav";
import ApprovalForm from "./ApprovalForm";

export default async function NewApprovalPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login?next=/approval/new");

  // 관리자 여부
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "ADMIN")
    .maybeSingle();
  const isAdmin = !!roles;

  // 현재 유저의 cafe24 mb_id & 이름 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  // 결재자 목록 (실제 결재자로 사용된 사람만)
  const [{ data: a1Ids }, { data: a2Ids }] = await Promise.all([
    supabase.from("approval_posts").select("approver1_mb_id"),
    supabase.from("approval_posts").select("approver2_mb_id"),
  ]);
  const approverIds = new Set<string>();
  for (const r of a1Ids || []) if (r.approver1_mb_id) approverIds.add(r.approver1_mb_id);
  for (const r of a2Ids || []) if (r.approver2_mb_id) approverIds.add(r.approver2_mb_id);
  const { data: members } = approverIds.size > 0
    ? await supabase.from("cafe24_members").select("mb_id, name").in("mb_id", Array.from(approverIds)).order("name")
    : { data: [] };

  // 예산 목록 (현재 연도)
  const year = new Date().getFullYear().toString();
  const { data: budgets } = await supabase
    .from("approval_budgets")
    .select("id, year, committee, account, budget, spending, balance, purpose, chairman, manager")
    .eq("year", year)
    .order("account");

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 pt-3 pb-20">
      <PageHeader title="문서작성" />

      <ApprovalForm
        authorName={profile?.name || user.email || ""}
        members={members || []}
        budgets={budgets || []}
        budgetYear={year}
      />

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user.id} />
    </div>
  );
}
