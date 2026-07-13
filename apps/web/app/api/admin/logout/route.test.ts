import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/admin/logout", () => {
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
