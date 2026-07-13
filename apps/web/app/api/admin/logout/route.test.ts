import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("POST /api/admin/logout", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirecciona para a origem pública canónica", async () => {
    vi.stubEnv("NDJAR_PUBLIC_ORIGIN", "https://admin.example.test");
    const response = await POST(
      new Request("http://web-internal:3000/api/admin/logout", {
        headers: { origin: "https://admin.example.test" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/admin/login",
    );
  });

  it("redirecciona com a origem do proxy explicitamente confiado", async () => {
    vi.stubEnv("NDJAR_TRUST_PROXY_HEADERS", "true");
    const response = await POST(
      new Request("http://web-internal:3000/api/admin/logout", {
        headers: {
          origin: "https://admin.example.test",
          "x-forwarded-host": "admin.example.test",
          "x-forwarded-proto": "https",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/admin/login",
    );
  });

  it("elimina o cookie administrativo e responde com 303", async () => {
    const response = await POST(
      new Request("https://admin.example.test/api/admin/logout", {
        headers: { origin: "https://admin.example.test" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/admin/login",
    );
    expect(response.headers.get("set-cookie")).toContain("ndjar_admin_access=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("não elimina a sessão quando a origem não é permitida", async () => {
    const response = await POST(
      new Request("https://admin.example.test/api/admin/logout", {
        headers: { origin: "https://malicious.example.test" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
