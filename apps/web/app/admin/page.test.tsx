import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AdminPage from "./page";

describe("AdminPage", () => {
  it("renderiza o texto principal em pt-PT sem mojibake", () => {
    const html = renderToString(<AdminPage />);

    expect(html).toContain("Visão geral pública");
    expect(html).toContain(
      "Área protegida para gerir utilizadores, subscrições, mapa agrícola, culturas, fórum, consultas e notificações.",
    );
    expect(html).not.toMatch(/[\u00c3\u00c2\ufffd]/);
  });
});
