import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("limita o conteúdo público a fixtures de demonstração", () => {
    const html = renderToString(<HomePage />);

    expect(html).toContain(
      "Dados locais de demonstração carregados por fixtures",
    );
    expect(html).toContain(
      "A autenticação administrativa requer PostgreSQL configurado",
    );
    expect(html).not.toContain("dados reais dos fixtures");
    expect(html).not.toContain("Admin com autenticação protegida");
    expect(html).not.toContain("Admin ainda sem autenticação");
  });
});
