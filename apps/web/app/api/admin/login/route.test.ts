import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

import { POST } from "./route";

function loginRequest() {
  const formData = new FormData();
  formData.set("identifier", "admin@example.test");
  formData.set("password", randomUUID());

  return new Request("https://admin.example.test/api/admin/login", {
    body: formData,
    method: "POST",
  });
}

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    cookieStore.set.mockReset();
    process.env.NDJAR_API_URL = "https://api.example.test";
  });

  it("cria a sessão e redirecciona quando o utilizador tem o papel admin", async () => {
    const accessToken = randomUUID();
    const fetchMock = vi.fn(async () =>
      Response.json({ accessToken, user: { roles: ["admin"] } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(POST(loginRequest())).rejects.toThrow("redirect:/admin");

    expect(cookieStore.set).toHaveBeenCalledWith(
      "ndjar_admin_access",
      accessToken,
      expect.objectContaining({
        httpOnly: true,
        maxAge: 60 * 15,
        path: "/",
        sameSite: "lax",
      }),
    );
  });

  it("não cria sessão quando as credenciais são inválidas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );

    await expect(POST(loginRequest())).rejects.toThrow(
      "redirect:/admin/login?error=invalid",
    );

    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("não cria sessão quando o utilizador não tem o papel admin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          accessToken: randomUUID(),
          user: { roles: ["farmer"] },
        }),
      ),
    );

    await expect(POST(loginRequest())).rejects.toThrow(
      "redirect:/admin/login?error=invalid",
    );

    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("não cria sessão quando a API devolve JSON inválido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{", {
            headers: { "content-type": "application/json" },
          }),
      ),
    );

    await expect(POST(loginRequest())).rejects.toThrow(
      "redirect:/admin/login?error=invalid",
    );

    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});
