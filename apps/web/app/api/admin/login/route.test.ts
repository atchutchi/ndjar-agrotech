import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

function loginRequest(
  origin = "https://admin.example.test",
  url = "https://admin.example.test/api/admin/login",
  extraHeaders: Record<string, string> = {},
) {
  const formData = new FormData();
  formData.set("identifier", "admin@example.test");
  formData.set("password", randomUUID());

  return new Request(url, {
    body: formData,
    headers: { origin, ...extraHeaders },
    method: "POST",
  });
}

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    process.env.NDJAR_API_URL = "https://api.example.test";
  });

  it("redirecciona para a origem pública canónica", async () => {
    vi.stubEnv("NDJAR_PUBLIC_ORIGIN", "https://admin.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          accessToken: randomUUID(),
          user: { roles: ["admin"] },
        }),
      ),
    );

    const response = await POST(
      loginRequest(
        "https://admin.example.test",
        "http://web-internal:3000/api/admin/login",
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/admin",
    );
  });

  it("cria a sessão e responde com 303 para o papel admin", async () => {
    const accessToken = randomUUID();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ accessToken, user: { roles: ["admin"] } }),
      ),
    );

    const response = await POST(loginRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/admin",
    );
    expect(response.headers.get("set-cookie")).toContain(
      `ndjar_admin_access=${accessToken}`,
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
  });

  it("aceita a política central para o papel super_admin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          accessToken: randomUUID(),
          user: { roles: ["super_admin"] },
        }),
      ),
    );

    const response = await POST(loginRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/admin",
    );
  });

  it("não cria sessão quando as credenciais são inválidas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );

    const response = await POST(loginRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/admin/login?error=invalid",
    );
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("não cria sessão quando o utilizador não tem acesso administrativo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          accessToken: randomUUID(),
          user: { roles: ["farmer"] },
        }),
      ),
    );

    const response = await POST(loginRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("set-cookie")).toBeNull();
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

    const response = await POST(loginRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("falha fechada quando falta a configuração da API", async () => {
    delete process.env.NDJAR_API_URL;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(loginRequest());

    expect(response.status).toBe(303);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("falha fechada quando a API não está disponível", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("API indisponível");
      }),
    );

    const response = await POST(loginRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it.each([
    ["origem ausente", undefined],
    ["origem diferente", "https://malicious.example.test"],
  ])("recusa %s antes de contactar a API", async (_scenario, origin) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = loginRequest(origin);
    if (origin === undefined) {
      request.headers.delete("origin");
    }

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
