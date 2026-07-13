import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_ACCESS_MAX_AGE,
  isAdminLoginSession,
} from "../../../../lib/admin-session";

function invalidLogin(): never {
  return redirect("/admin/login?error=invalid");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  const apiUrl = process.env.NDJAR_API_URL?.replace(/\/+$/, "");

  if (!apiUrl) {
    invalidLogin();
  }

  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      body: JSON.stringify({ identifier, password }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      invalidLogin();
    }

    const session: unknown = await response.json();
    if (!isAdminLoginSession(session)) {
      invalidLogin();
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_ACCESS_COOKIE, session.accessToken, {
      httpOnly: true,
      maxAge: ADMIN_ACCESS_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    invalidLogin();
  }

  redirect("/admin");
}
