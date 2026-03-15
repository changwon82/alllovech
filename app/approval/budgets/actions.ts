"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRoles, isAdminRole } from "@/lib/admin";

async function requireApprovalAdmin() {
  const { supabase, user } = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  const roles = await getUserRoles(supabase, user.id);
  if (!isAdminRole(roles)) throw new Error("관리자 권한이 필요합니다.");
  return { user, admin: createAdminClient() };
}

export async function createBudget(formData: FormData) {
  try {
    const { admin } = await requireApprovalAdmin();

    const year = (formData.get("year") as string)?.trim();
    const account = (formData.get("account") as string)?.trim();
    if (!year || !account) return { error: "년도와 계정이름은 필수입니다." };

    const { error } = await admin.from("approval_budgets").insert({
      year,
      bg_code: (formData.get("bg_code") as string)?.trim() || null,
      committee: (formData.get("committee") as string)?.trim() || null,
      account,
      budget: parseInt(formData.get("budget") as string, 10) || 0,
      spending: parseInt(formData.get("spending") as string, 10) || 0,
      balance: parseInt(formData.get("balance") as string, 10) || 0,
      purpose: (formData.get("purpose") as string)?.trim() || null,
      chairman: (formData.get("chairman") as string)?.trim() || null,
      manager: (formData.get("manager") as string)?.trim() || null,
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateBudget(formData: FormData) {
  try {
    const { admin } = await requireApprovalAdmin();

    const id = parseInt(formData.get("id") as string, 10);
    if (!id) return { error: "ID가 없습니다." };

    const account = (formData.get("account") as string)?.trim();
    if (!account) return { error: "계정이름은 필수입니다." };

    const { error } = await admin
      .from("approval_budgets")
      .update({
        year: (formData.get("year") as string)?.trim(),
        bg_code: (formData.get("bg_code") as string)?.trim() || null,
        committee: (formData.get("committee") as string)?.trim() || null,
        account,
        budget: parseInt(formData.get("budget") as string, 10) || 0,
        spending: parseInt(formData.get("spending") as string, 10) || 0,
        balance: parseInt(formData.get("balance") as string, 10) || 0,
        purpose: (formData.get("purpose") as string)?.trim() || null,
        chairman: (formData.get("chairman") as string)?.trim() || null,
        manager: (formData.get("manager") as string)?.trim() || null,
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteBudget(formData: FormData) {
  try {
    const { admin } = await requireApprovalAdmin();

    const id = parseInt(formData.get("id") as string, 10);
    if (!id) return { error: "ID가 없습니다." };

    const { error } = await admin
      .from("approval_budgets")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
