import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_ACCESS_MAX_AGE,
  isAdminLoginSession,
} from "../../../../lib/admin-session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  let session: { accessToken: string; user: { roles: string[] } } | null = null;

  try {
    const apiUrl = process.env.NDJAR_API_URL?.replace(/\/+$/, "");
    if (!apiUrl) {
      throw new Error("NDJAR_API_URL is required");
    }

    const response = await fetch(`${apiUrl}/auth/login`, {
      body: JSON.stringify({ identifier, password }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    if (response.ok) {
      const candidate: unknown = await response.json();
      if (isAdminLoginSession(candidate)) {
        session = candidate;
      }
    }
  } catch {}

  if (!session) {
    redirect("/admin/login?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_ACCESS_COOKIE, session.accessToken, {
    httpOnly: true,
    maxAge: ADMIN_ACCESS_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}
