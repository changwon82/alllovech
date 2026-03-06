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
          next = `/365bible/invite/${inviteCode}/accept`;
        }
      }

      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.delete("invite_code");
      return response;
    }

    // 코드 교환 실패 — 이미 로그인된 세션이 있으면 next로 이동
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.delete("invite_code");
      return response;
    }
  }

  // 에러 시: 초대 링크 경로면 초대 페이지로 복귀, 아니면 로그인 페이지로
  const inviteMatch = next.match(/\/365bible\/invite\/([^/]+)/);
  if (inviteMatch) {
    return NextResponse.redirect(`${origin}/365bible/invite/${inviteMatch[1]}`);
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
