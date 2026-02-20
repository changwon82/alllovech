import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service Role 클라이언트 — RLS를 우회하여 관리자 작업에 사용
 * 서버 사이드에서만 사용할 것 (절대 클라이언트에 노출 금지)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
