import { describe, expect, it, vi } from "vitest";

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

describe("POST /api/admin/logout", () => {
  it("elimina o cookie administrativo e redirecciona para o login", async () => {
    await expect(POST()).rejects.toThrow("redirect:/admin/login");

    expect(cookieStore.set).toHaveBeenCalledWith(
      "ndjar_admin_access",
      "",
      expect.objectContaining({ maxAge: 0, path: "/" }),
    );
  });
});
