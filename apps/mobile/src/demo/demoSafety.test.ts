import { describe, expect, it } from "vitest";

import {
  createDoctorDraftResult,
  createUnavailableActionResult,
  DEMO_ACCESS_LABEL,
  DEMO_CAPABILITIES,
  DEMO_PAYMENT_NOTICE,
  TEMPORARY_DRAFT_NOTICE,
} from "./demoSafety";

describe("demonstration safety messages", () => {
  it("never claims that a doctor request was sent or promises a response time", () => {
    const result = createDoctorDraftResult();

    expect(result.status).toBe("temporary-draft");
    expect(result.message).toContain("não foi enviado");
    expect(result.message).not.toMatch(
      /24\s*h|pedido criado|consultor recebeu/i,
    );
    expect(TEMPORARY_DRAFT_NOTICE).toContain("memória desta sessão");
  });

  it("does not present a demonstration payment as a subscription", () => {
    expect(DEMO_PAYMENT_NOTICE).toContain("nenhuma cobrança");
    expect(DEMO_PAYMENT_NOTICE).toContain("não activa uma subscrição");
    expect(DEMO_ACCESS_LABEL).toBe("Explorar demonstração");
  });

  it("describes only capabilities that the local demonstration actually provides", () => {
    expect(DEMO_CAPABILITIES).toEqual([
      expect.objectContaining({
        description: expect.stringContaining("ilustrativo"),
        title: "Esquema do piloto",
      }),
      expect.objectContaining({
        description: expect.stringContaining("por validar"),
        title: "Fichas de cultivo",
      }),
      expect.objectContaining({
        description: expect.stringContaining("sem envio"),
        title: "Análise local",
      }),
    ]);

    expect(JSON.stringify(DEMO_CAPABILITIES)).not.toMatch(
      /mapa interactivo|encaminhamento|recomendações prudentes/i,
    );
  });

  it.each(["fotografia", "sincronização", "terminar sessão"])(
    "marks %s as unavailable instead of reporting success",
    (action) => {
      const result = createUnavailableActionResult(action);

      expect(result.available).toBe(false);
      expect(result.message).toContain("ainda não está disponível");
    },
  );
});
