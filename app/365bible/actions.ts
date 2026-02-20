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
  visibility: "private" | "group" | "public";
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
  visibility: "private" | "group" | "public"
) {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data, error } = await supabase
    .from("reflections")
    .upsert(
      { user_id: user.id, day, year, content, visibility, updated_at: new Date().toISOString() },
      { onConflict: "user_id,day,year" }
    )
    .select("id, content, visibility, created_at, updated_at")
    .single();

  if (error) return { error: error.message };

  // visibility가 group이면 내 소그룹에 자동 공유
  if (visibility === "group" && data) {
    const { data: myGroups } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (myGroups && myGroups.length > 0) {
      const shares = myGroups.map((g: { group_id: string }) => ({
        reflection_id: data.id,
        group_id: g.group_id,
      }));
      await supabase
        .from("reflection_group_shares")
        .upsert(shares, { onConflict: "reflection_id,group_id", ignoreDuplicates: true });
    }
  } else if (visibility === "private" && data) {
    // private으로 변경하면 공유 해제
    await supabase
      .from("reflection_group_shares")
      .delete()
      .eq("reflection_id", data.id);
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
