import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  get: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import { getVerifiedAdminSession } from "./admin-session";

describe("getVerifiedAdminSession", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.get.mockReturnValue({ value: randomUUID() });
    process.env.NDJAR_API_URL = "https://api.example.test";
  });

  it("aceita uma sessão validada pela API para o papel admin", async () => {
    const accessToken = randomUUID();
    cookieStore.get.mockReturnValue({ value: accessToken });
    const fetchMock = vi.fn(async () =>
      Response.json({ id: randomUUID(), roles: ["admin"] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getVerifiedAdminSession()).resolves.toEqual(
      expect.objectContaining({ roles: ["admin"] }),
    );
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/auth/me", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });

  it("aceita uma sessão validada pela política central para super_admin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ id: randomUUID(), roles: ["super_admin"] }),
      ),
    );

    await expect(getVerifiedAdminSession()).resolves.toEqual(
      expect.objectContaining({ roles: ["super_admin"] }),
    );
  });

  it.each([
    ["token inválido", new Response(null, { status: 401 })],
    ["papel insuficiente", Response.json({ roles: ["consultant"] })],
  ])("rejeita %s", async (_scenario, response) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response),
    );

    await expect(getVerifiedAdminSession()).resolves.toBeNull();
  });

  it("rejeita uma resposta JSON inválida", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{", {
            headers: { "content-type": "application/json" },
          }),
      ),
    );

    await expect(getVerifiedAdminSession()).resolves.toBeNull();
  });

  it("rejeita a sessão quando falta a configuração da API", async () => {
    delete process.env.NDJAR_API_URL;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getVerifiedAdminSession()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
