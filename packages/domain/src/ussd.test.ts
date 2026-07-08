import { describe, expect, it } from "vitest";

import { buildUssdSessionState } from "./index.js";

describe("buildUssdSessionState", () => {
  it("preserves deterministic menu progress for future USSD sessions", () => {
    expect(
      buildUssdSessionState({
        sessionId: "ussd-1",
        phoneNumber: "+245955000111",
        route: ["main", "consultation", "language"],
      }),
    ).toEqual({
      sessionId: "ussd-1",
      phoneNumber: "+245955000111",
      route: ["main", "consultation", "language"],
      depth: 3,
      currentScreen: "language",
    });
  });
});
