export interface UssdSessionInput {
  sessionId: string;
  phoneNumber: string;
  route: string[];
}

export interface UssdSessionState extends UssdSessionInput {
  depth: number;
  currentScreen: string | null;
}

export function buildUssdSessionState(
  input: UssdSessionInput,
): UssdSessionState {
  return {
    ...input,
    depth: input.route.length,
    currentScreen: input.route.at(-1) ?? null,
  };
}
