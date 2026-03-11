import { getSessionUser } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PageHeader from "@/app/components/ui/PageHeader";
import BottomNav from "@/app/components/BottomNav";
import ApprovalForm from "../../new/ApprovalForm";

export default async function EditApprovalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  const { supabase, user } = await getSessionUser();
  if (!user) redirect(`/login?next=/approval/${id}/edit`);

  // 게시글 + 권한 확인
  const [{ data: post }, { data: roles }] = await Promise.all([
    supabase.from("approval_posts").select("*").eq("id", postId).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "ADMIN").maybeSingle(),
  ]);

  if (!post) notFound();
  const isAdmin = !!roles;
  if (!isAdmin && post.requester_mb_id !== user.id) redirect(`/approval/${id}`);

  // 필요한 데이터 병렬 조회
  const [{ data: profile }, { data: members }, { data: items }, { data: files }, budgetsResult] =
    await Promise.all([
      supabase.from("profiles").select("name").eq("id", user.id).single(),
      supabase.from("approval_members").select("mb_id, name, position, status").order("sort_order"),
      supabase
        .from("approval_items")
        .select("item_name, quantity, unit_price, note")
        .eq("post_id", postId)
        .order("id"),
      supabase
        .from("approval_files")
        .select("file_name, original_name")
        .eq("post_id", postId)
        .order("sort_order"),
      supabase
        .from("approval_budgets")
        .select("id, year, committee, account, budget, spending, balance, purpose, chairman, manager")
        .eq("year", new Date().getFullYear().toString())
        .order("account"),
    ]);

  const budgets = budgetsResult.data || [];
  const year = new Date().getFullYear().toString();

  // 예산에서 committee 역산
  const matchedBudget = post.account_name
    ? budgets.find((b) => b.account === post.account_name)
    : null;

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 pt-3 pb-20">
      <PageHeader title="문서수정" />

      <ApprovalForm
        authorName={profile?.name || user.email || ""}
        members={members || []}
        budgets={budgets}
        budgetYear={year}
        initialData={{
          id: postId,
          approver1_mb_id: post.approver1_mb_id || "",
          approver2_mb_id: post.approver2_mb_id || null,
          doc_category: post.doc_category || "",
          title: post.title || "",
          content: post.content || "",
          account_name: post.account_name || null,
          ref_department: post.ref_department || null,
          ref_members: post.ref_members || null,
          budget_id: matchedBudget?.id ?? null,
          committee: matchedBudget?.committee ?? null,
          items: (items || []).map((item) => ({
            item_name: item.item_name || "",
            quantity: item.quantity || 0,
            unit_price: item.unit_price || 0,
            note: item.note || "",
          })),
          files: (files || []).map((f) => ({
            file_name: f.file_name,
            original_name: f.original_name,
          })),
        }}
      />

      <BottomNav isAdmin={isAdmin} canViewGroups userId={user.id} />
    </div>
  );
}
