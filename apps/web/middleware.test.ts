import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "./middleware";

describe("middleware administrativo", () => {
  it("permite rotas fora da área administrativa", () => {
    const response = middleware(
      new NextRequest("https://admin.example.test/publica"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("permite a página de login sem cookie", () => {
    const response = middleware(
      new NextRequest("https://admin.example.test/admin/login"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("deixa passar um cookie presente para validação no servidor", () => {
    const response = middleware(
      new NextRequest("https://admin.example.test/admin", {
        headers: { cookie: `ndjar_admin_access=${randomUUID()}` },
      }),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirecciona quando não existe cookie", () => {
    const response = middleware(
      new NextRequest("https://admin.example.test/admin"),
    );

    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/admin/login",
    );
  });
});
