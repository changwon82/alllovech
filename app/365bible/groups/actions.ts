"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createGroupFromPreset(presetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인 필요" };

  const admin = createAdminClient();

  // 프리셋 + 다코방 정보 조회
  const { data: preset, error: presetError } = await admin
    .from("bible_group_presets")
    .select("id, dakobang_group_id, group_id, dakobang_groups(name)")
    .eq("id", presetId)
    .single();

  if (presetError || !preset) return { error: "프리셋을 찾을 수 없습니다" };
  if (preset.group_id) return { error: "이미 함께읽기가 생성되었습니다" };

  const dakobangName = (preset.dakobang_groups as unknown as { name: string })?.name ?? "함께읽기";

  // 함께읽기 그룹 생성
  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({ name: dakobangName, type: "group" })
    .select("id")
    .single();

  if (groupError || !group) return { error: groupError?.message ?? "그룹 생성 실패" };

  // 현재 유저를 leader로 추가
  const { error: memberError } = await admin
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "leader" });

  if (memberError) return { error: memberError.message };

  // 프리셋에 group_id 연결
  const { error: updateError } = await admin
    .from("bible_group_presets")
    .update({ group_id: group.id })
    .eq("id", presetId);

  if (updateError) return { error: updateError.message };

  return { groupId: group.id };
}
