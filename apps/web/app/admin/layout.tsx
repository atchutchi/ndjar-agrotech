import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getVerifiedAdminSession } from "../../lib/admin-session";

import type { ReactNode } from "react";

const ADMIN_LOGIN_HEADER = "x-ndjar-admin-login";

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers();
  if (requestHeaders.get(ADMIN_LOGIN_HEADER) === "1") {
    return children;
  }

  const session = await getVerifiedAdminSession();
  if (!session) {
    redirect("/admin/login?error=session");
  }

  return children;
}
