"use server";

import { getSessionUser } from "@/lib/supabase/server";

export async function toggleCheck(day: number, year: number) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // 이미 체크돼 있는지 확인
  const { data: existing } = await supabase
    .from("bible_checks")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("day", day)
    .eq("year", year)
    .maybeSingle();

  if (existing) {
    // 체크 해제
    const { error } = await supabase
      .from("bible_checks")
      .delete()
      .eq("user_id", user.id)
      .eq("day", day)
      .eq("year", year);
    if (error) return { error: error.message };

    return { checked: false };
  } else {
    // 체크
    const { error } = await supabase
      .from("bible_checks")
      .insert({ user_id: user.id, day, year });
    if (error) return { error: error.message };

    return { checked: true };
  }
}

export async function getCheckedDays(year: number): Promise<number[]> {
  const { supabase, user } = await getSessionUser();
  if (!user) return [];

  const { data } = await supabase
    .from("bible_checks")
    .select("day")
    .eq("user_id", user.id)
    .eq("year", year);

  return (data ?? []).map((d) => d.day);
}

// ---- 묵상 (Reflections) ----

export type Reflection = {
  id: string;
  content: string;
  visibility: "private" | "group";
  created_at: string;
  updated_at: string;
};

export async function getReflection(day: number, year: number): Promise<Reflection | null> {
  const { supabase, user } = await getSessionUser();
  if (!user) return null;

  const { data } = await supabase
    .from("reflections")
    .select("id, content, visibility, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("day", day)
    .eq("year", year)
    .maybeSingle();

  return data as Reflection | null;
}

export async function saveReflection(
  day: number,
  year: number,
  content: string,
  groupIds: string[] | null // null = 기존 공유 유지 (내용만 수정), [] = 나만보기, ["id",...] = 선택 그룹 공유
) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const visibility = groupIds === null ? undefined : groupIds.length > 0 ? "group" : "private";

  const upsertData: Record<string, unknown> = {
    user_id: user.id, day, year, content, updated_at: new Date().toISOString(),
  };
  if (visibility !== undefined) upsertData.visibility = visibility;

  const { data, error } = await supabase
    .from("reflections")
    .upsert(upsertData, { onConflict: "user_id,day,year" })
    .select("id, content, visibility, created_at, updated_at")
    .single();

  if (error) return { error: error.message };

  // groupIds가 null이면 공유 변경 없음 (내용만 수정)
  if (groupIds !== null && data) {
    // 기존 공유 삭제
    await supabase
      .from("reflection_group_shares")
      .delete()
      .eq("reflection_id", data.id);

    // 선택된 그룹만 공유
    if (groupIds.length > 0) {
      // 보안: 실제 멤버인 그룹만 필터
      const { data: validGroups } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .in("group_id", groupIds);

      const validGroupIds = (validGroups ?? []).map((g: { group_id: string }) => g.group_id);
      if (validGroupIds.length > 0) {
        await supabase
          .from("reflection_group_shares")
          .insert(validGroupIds.map((gid: string) => ({
            reflection_id: data.id,
            group_id: gid,
          })));
      }
    }
  }

  return { reflection: data as Reflection };
}

export async function deleteReflection(day: number, year: number) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("reflections")
    .delete()
    .eq("user_id", user.id)
    .eq("day", day)
    .eq("year", year);

  if (error) return { error: error.message };
  return { deleted: true };
}
