import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // 已登录用户访问登录页 → 跳转首页
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 未登录用户访问受保护页面 → 跳转登录页
  if (!session && pathname !== "/login") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
