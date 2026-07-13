export const DEMO_ACCESS_LABEL = "Explorar demonstração";

export const DEMO_PAYMENT_NOTICE =
  "Pagamento indisponível nesta demonstração: nenhuma cobrança foi efectuada e esta acção não activa uma subscrição.";

export const TEMPORARY_DRAFT_NOTICE =
  "Rascunho temporário guardado apenas na memória desta sessão.";

export const DEMO_CAPABILITIES = [
  {
    description:
      "Exploração de um esquema ilustrativo com pontos do diagnóstico piloto.",
    icon: "map-search-outline" as const,
    id: "pilot-map",
    title: "Esquema do piloto",
  },
  {
    description:
      "Consulta de culturas e intervalos de pH do protótipo, ainda por validar.",
    icon: "sprout-outline" as const,
    id: "crop-sheets",
    title: "Fichas de cultivo",
  },
  {
    description:
      "Análise educativa no dispositivo, sem envio a um consultor agrícola.",
    icon: "medical-bag" as const,
    id: "local-analysis",
    title: "Análise local",
  },
] as const;

export function createDoctorDraftResult() {
  return {
    message:
      "A pergunta foi analisada apenas neste dispositivo. O rascunho não foi enviado a um consultor.",
    status: "temporary-draft" as const,
  };
}

export function createUnavailableActionResult(action: string) {
  return {
    available: false,
    message: `${action[0]?.toUpperCase()}${action.slice(1)} ainda não está disponível nesta demonstração.`,
  };
}
