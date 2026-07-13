import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

describe("proxy administrativo", () => {
  it("permite rotas fora da area administrativa", () => {
    const response = proxy(
      new NextRequest("https://admin.example.test/publica"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("permite a pagina de login sem cookie", () => {
    const response = proxy(
      new NextRequest("https://admin.example.test/admin/login"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("deixa passar um cookie presente para validacao no servidor", () => {
    const response = proxy(
      new NextRequest("https://admin.example.test/admin", {
        headers: { cookie: `ndjar_admin_access=${randomUUID()}` },
      }),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirecciona quando nao existe cookie", () => {
    const response = proxy(new NextRequest("https://admin.example.test/admin"));

    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/admin/login",
    );
  });

  it("remove o cabecalho interno forjado fora do login", () => {
    const response = proxy(
      new NextRequest("https://admin.example.test/admin", {
        headers: {
          cookie: `ndjar_admin_access=${randomUUID()}`,
          "x-ndjar-admin-login": "1",
        },
      }),
    );

    expect(
      response.headers.get("x-middleware-request-x-ndjar-admin-login"),
    ).toBeNull();
    expect(
      response.headers
        .get("x-middleware-override-headers")
        ?.split(",")
        .map((header) => header.trim()),
    ).not.toContain("x-ndjar-admin-login");
  });
});
