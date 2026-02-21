import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // next 파라미터가 유실된 경우, invite_code 쿠키로 복구
      if (next === "/") {
        const cookieStore = await cookies();
        const inviteCode = cookieStore.get("invite_code")?.value;
        if (inviteCode) {
          next = `/invite/${inviteCode}/accept`;
        }
      }

      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.delete("invite_code");
      return response;
    }
  }

  // 에러 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
