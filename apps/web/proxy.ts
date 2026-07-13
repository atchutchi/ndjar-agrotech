import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ACCESS_COOKIE = "ndjar_admin_access";
const ADMIN_LOGIN_HEADER = "x-ndjar-admin-login";

export function proxy(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  const isLogin = request.nextUrl.pathname === "/admin/login";

  if (!isAdmin) {
    return NextResponse.next();
  }

  if (!isLogin && !request.cookies.has(ADMIN_ACCESS_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(ADMIN_LOGIN_HEADER);
  if (isLogin) {
    requestHeaders.set(ADMIN_LOGIN_HEADER, "1");
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
