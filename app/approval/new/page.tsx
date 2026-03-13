import { getSessionUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/app/components/ui/PageHeader";
import ApprovalForm from "./ApprovalForm";

export default async function NewApprovalPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login?next=/approval/new");

  // 현재 유저의 cafe24 mb_id & 이름 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  // 결재자 목록
  const { data: members } = await supabase
    .from("approval_members")
    .select("mb_id, name, position, status")
    .order("sort_order");

  // 예산 목록 (현재 연도)
  const year = new Date().getFullYear().toString();
  const { data: budgets } = await supabase
    .from("approval_budgets")
    .select("id, year, committee, account, budget, spending, balance, purpose, chairman, manager")
    .eq("year", year)
    .order("account");

  return (
    <>
      <PageHeader title="문서작성" />
      <ApprovalForm
        authorName={profile?.name || user.email || ""}
        members={members || []}
        budgets={budgets || []}
        budgetYear={year}
      />
    </>
  );
}
