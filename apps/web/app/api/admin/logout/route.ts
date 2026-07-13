import { NextResponse } from "next/server";

import {
  getPublicRequestOrigin,
  isSameOriginRequest,
} from "../../../../lib/admin-origin";
import { ADMIN_ACCESS_COOKIE } from "../../../../lib/admin-session";

export async function POST(request: Request) {
  const publicOrigin = getPublicRequestOrigin(request);
  if (!publicOrigin || !isSameOriginRequest(request)) {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }

  const response = NextResponse.redirect(
    new URL("/admin/login", publicOrigin),
    303,
  );
  response.cookies.set(ADMIN_ACCESS_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
