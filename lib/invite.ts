import { createAdminClient } from "@/lib/supabase/admin";

/** 8자리 영숫자 코드 생성 (혼동 문자 0/O/1/l/I 제외) */
export function generateInviteCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  let code = "";
  for (const byte of array) {
    code += chars[byte % chars.length];
  }
  return code;
}

/** 코드로 초대 정보 조회 (service role — 비로그인 사용자도 접근 필요) */
export async function getInviteByCode(code: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("group_invites")
    .select("id, group_id, expires_at, is_active, groups(id, name, type, description)")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;

  // 만료 확인
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return data;
}
