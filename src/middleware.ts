import { NextRequest, NextResponse } from "next/server";

// 简单的中间件：检查是否有 next-auth.session-token cookie
// 如果没登录且不在登录页，跳转到登录页
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 登录页不需要保护
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // AI 辅助/静态资源不需要保护
  if (pathname.startsWith("/_next/") || pathname.startsWith("/api/") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // 检查 session cookie（兼容不同 NextAuth 版本）
  const cookies = req.cookies;
  const sessionToken =
    cookies.get("next-auth.session-token")?.value ||
    cookies.get("__Secure-next-auth.session-token")?.value ||
    cookies.get("authjs.session-token")?.value ||
    cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
