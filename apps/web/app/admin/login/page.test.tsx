import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AdminLoginPage from "./page";

describe("AdminLoginPage", () => {
  it("apresenta os campos e a linguagem pt-PT", () => {
    const html = renderToString(<AdminLoginPage />);

    expect(html.replaceAll("&#x27;", "'")).toContain("Entrar no N'djar Admin");
    expect(html).toContain("Telefone ou email");
    expect(html).toContain("Palavra-passe");
  });
});
