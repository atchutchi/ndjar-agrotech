export const DEMO_ACCESS_LABEL = "Explorar demonstração";

export const DEMO_PAYMENT_NOTICE =
  "Pagamento indisponível nesta demonstração: nenhuma cobrança foi efectuada e esta acção não activa uma subscrição.";

export const TEMPORARY_DRAFT_NOTICE =
  "Rascunho temporário guardado apenas na memória desta sessão.";

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
