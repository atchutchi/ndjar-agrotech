import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AdminLoginPage from "./page";

describe("AdminLoginPage", () => {
  it("apresenta os campos e a linguagem pt-PT", async () => {
    const html = renderToString(await AdminLoginPage({}));

    expect(html.replaceAll("&#x27;", "'")).toContain("Entrar no N'djar Admin");
    expect(html).toContain("Telefone ou email");
    expect(html).toContain("Palavra-passe");
  });

  it.each([
    ["invalid", "Credenciais inválidas"],
    ["session", "A sessão terminou"],
  ])("apresenta o erro %s", async (error, message) => {
    const html = renderToString(
      await AdminLoginPage({ searchParams: Promise.resolve({ error }) }),
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain(message);
  });
});
