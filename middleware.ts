import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 페이지는 세션 갱신 없이 바로 통과 (TTFB 단축)
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/365bible") ||
    pathname === "/my" ||
    pathname.startsWith("/spend-report") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth/")
  ) {
    // 초대 페이지 방문 시 invite_code 쿠키 저장 (OAuth 리다이렉트 유실 대비)
    const inviteMatch = pathname.match(/^\/365bible\/invite\/([^/]+)$/);
    if (inviteMatch) {
      const response = NextResponse.next();
      response.cookies.set("invite_code", inviteMatch[1], {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60, // 1시간
        sameSite: "lax",
      });
      response.headers.set("x-pathname", pathname);
      return response;
    }
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  const response = await updateSession(request);
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
