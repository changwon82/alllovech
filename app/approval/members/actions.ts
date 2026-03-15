"use server";

import { getSessionUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRoles, isAdminRole } from "@/lib/admin";

const SECTION_MAP: Record<string, number> = {
  예배: 1, 목양: 2, 재정: 3, 총무: 4, 선교: 5, 교육: 6, 설비: 7, 기획: 8, 기타: 0,
};

async function requireApprovalAdmin() {
  const { supabase, user } = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  const roles = await getUserRoles(supabase, user.id);
  if (!isAdminRole(roles)) throw new Error("관리자 권한이 필요합니다.");
  return { user, admin: createAdminClient() };
}

export async function createMember(formData: FormData) {
  try {
    const { admin } = await requireApprovalAdmin();

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { error: "이름을 입력하세요." };

    const sectionLabel = (formData.get("mb_section") as string) || "기타";
    const mb_section = SECTION_MAP[sectionLabel] ?? 0;
    const status = (formData.get("status") as string) || "재직";
    const mb_id = (formData.get("mb_id") as string)?.trim() || null;

    // mb_id 중복 체크
    if (mb_id) {
      const { data: existing } = await admin
        .from("approval_members")
        .select("id")
        .eq("mb_id", mb_id)
        .maybeSingle();
      if (existing) return { error: "이미 등록된 아이디입니다." };
    }

    // sort_order 자동 할당
    const { data: maxRow } = await admin
      .from("approval_members")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();
    const nextOrder = (maxRow?.sort_order ?? 0) + 1;

    const { error } = await admin.from("approval_members").insert({
      mb_id,
      name: name.normalize("NFC"),
      position: (formData.get("position") as string)?.trim() || null,
      status,
      sort_order: nextOrder,
      mb_section,
      mb_kind: (formData.get("mb_kind") as string)?.trim() || null,
      mb_birth: (formData.get("mb_birth") as string)?.trim() || null,
      mb_email: (formData.get("mb_email") as string)?.trim() || null,
      mb_hp: (formData.get("mb_hp") as string)?.trim() || null,
      mb_tel: (formData.get("mb_tel") as string)?.trim() || null,
      mb_area: (formData.get("mb_area") as string)?.trim() || null,
      join_date: (formData.get("join_date") as string)?.trim() || null,
      retire_date: (formData.get("retire_date") as string)?.trim() || null,
      extra_dept: (formData.get("extra_dept") as string)?.trim() || null,
      mb_addr1: (formData.get("mb_addr1") as string)?.trim() || null,
      mb_addr2: (formData.get("mb_addr2") as string)?.trim() || null,
      mb_addr3: (formData.get("mb_addr3") as string)?.trim() || null,
      mb_zip: (formData.get("mb_zip") as string)?.trim() || null,
      mb_content: (formData.get("mb_content") as string)?.trim() || null,
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateMember(formData: FormData) {
  try {
    const { admin } = await requireApprovalAdmin();

    const id = parseInt(formData.get("id") as string, 10);
    if (!id) return { error: "ID가 없습니다." };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { error: "이름을 입력하세요." };

    const sectionLabel = (formData.get("mb_section") as string) || "기타";
    const mb_section = SECTION_MAP[sectionLabel] ?? 0;
    const mb_id = (formData.get("mb_id") as string)?.trim() || null;

    // mb_id 중복 체크 (자기 자신 제외)
    if (mb_id) {
      const { data: existing } = await admin
        .from("approval_members")
        .select("id")
        .eq("mb_id", mb_id)
        .neq("id", id)
        .maybeSingle();
      if (existing) return { error: "이미 등록된 아이디입니다." };
    }

    const { error } = await admin
      .from("approval_members")
      .update({
        mb_id,
        name: name.normalize("NFC"),
        position: (formData.get("position") as string)?.trim() || null,
        status: (formData.get("status") as string) || "재직",
        mb_section,
        mb_kind: (formData.get("mb_kind") as string)?.trim() || null,
        mb_birth: (formData.get("mb_birth") as string)?.trim() || null,
        mb_email: (formData.get("mb_email") as string)?.trim() || null,
        mb_hp: (formData.get("mb_hp") as string)?.trim() || null,
        mb_tel: (formData.get("mb_tel") as string)?.trim() || null,
        mb_area: (formData.get("mb_area") as string)?.trim() || null,
        join_date: (formData.get("join_date") as string)?.trim() || null,
        retire_date: (formData.get("retire_date") as string)?.trim() || null,
        extra_dept: (formData.get("extra_dept") as string)?.trim() || null,
        mb_addr1: (formData.get("mb_addr1") as string)?.trim() || null,
        mb_addr2: (formData.get("mb_addr2") as string)?.trim() || null,
        mb_addr3: (formData.get("mb_addr3") as string)?.trim() || null,
        mb_zip: (formData.get("mb_zip") as string)?.trim() || null,
        mb_content: (formData.get("mb_content") as string)?.trim() || null,
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteMember(formData: FormData) {
  try {
    const { admin } = await requireApprovalAdmin();

    const id = parseInt(formData.get("id") as string, 10);
    if (!id) return { error: "ID가 없습니다." };

    const { error } = await admin
      .from("approval_members")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
