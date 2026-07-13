import { cookies } from "next/headers";
import { canAccessAdmin, NDJAR_ROLES, type NdjarRole } from "@ndjar/domain";

export const ADMIN_ACCESS_COOKIE = "ndjar_admin_access";
export const ADMIN_ACCESS_MAX_AGE = 60 * 15;

export interface AdminSession {
  displayName?: string | null;
  id?: string;
  roles: string[];
}

function hasRoles(value: unknown): value is { roles: string[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "roles" in value &&
    Array.isArray(value.roles) &&
    value.roles.every((role) => typeof role === "string")
  );
}

export function hasAdminRole(value: unknown): value is AdminSession {
  if (!hasRoles(value)) {
    return false;
  }

  const knownRoles = value.roles.filter((role): role is NdjarRole =>
    Object.values(NDJAR_ROLES).includes(role as NdjarRole),
  );
  return canAccessAdmin(knownRoles);
}

export function isAdminLoginSession(
  value: unknown,
): value is { accessToken: string; user: AdminSession } {
  return (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    typeof value.accessToken === "string" &&
    value.accessToken.length > 0 &&
    "user" in value &&
    hasAdminRole(value.user)
  );
}

export async function getVerifiedAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value;
  const apiUrl = process.env.NDJAR_API_URL?.replace(/\/+$/, "");

  if (!accessToken || !apiUrl) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return null;
    }

    const session: unknown = await response.json();
    return hasAdminRole(session) ? session : null;
  } catch {
    return null;
  }
}
