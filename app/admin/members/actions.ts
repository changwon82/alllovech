"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  if (!roleSet.has("ADMIN")) {
    return { error: "권한 없음" };
  }

  return { error: null };
}

export async function bulkCreateChurchMembers(names: string[]) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const rows = names.map((name) => ({ name: name.trim() })).filter((r) => r.name);
  if (!rows.length) return { error: "이름이 없습니다" };

  const { data, error: insertError } = await admin
    .from("church_members")
    .insert(rows)
    .select();

  if (insertError) return { error: insertError.message };
  return { data };
}

export async function deleteChurchMember(id: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("church_members")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };
  return { success: true };
}

type MemberFields = {
  gender?: string;
  birth_date?: string;
  phone?: string;
};

const ALLOWED_FIELDS: (keyof MemberFields)[] = ["gender", "birth_date", "phone"];

export async function bulkUpdateMemberFields(
  updates: ({ name: string } & MemberFields)[]
) {
  const { error: authError } = await checkAdmin();
  if (authError) return { error: authError };

  const admin = createAdminClient();

  // 이름 → id 매핑
  const { data: allMembers } = await admin.from("church_members").select("id, name");
  const nameMap = new Map((allMembers ?? []).map((m: { id: string; name: string }) => [m.name, m.id]));

  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const u of updates) {
    const id = nameMap.get(u.name);
    if (!id) { unmatched.push(u.name); continue; }

    const fields: Partial<MemberFields> = {};
    for (const key of ALLOWED_FIELDS) {
      if (u[key] !== undefined && u[key] !== "") fields[key] = u[key];
    }

    if (Object.keys(fields).length > 0) {
      await admin.from("church_members").update(fields).eq("id", id);
      matched.push(u.name);
    }
  }

  return { matched, unmatched };
}

export async function updateChurchMember(
  id: string,
  fields: { name?: string; gender?: string; birth_date?: string; phone?: string }
) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("church_members")
    .update(fields)
    .eq("id", id);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

export async function deleteAllChurchMembers() {
  const { error } = await checkAdmin();
  if (error) return { error };

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("church_members")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) return { error: deleteError.message };
  return { success: true };
}
