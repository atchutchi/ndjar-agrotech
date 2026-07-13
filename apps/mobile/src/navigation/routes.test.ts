import { describe, expect, it } from "vitest";

import { backStack, makeRoot, openTabStack, type AppRoute } from "./routes";

describe("mobile route stack", () => {
  it("keeps the previous screen below a paywall opened from a locked tab", () => {
    const home = makeRoot("home");

    const nextStack = openTabStack([home], "map", false);

    expect(nextStack).toEqual([
      home,
      {
        name: "subscription",
        params: { targetName: "root", targetTab: "map" },
        tab: "home",
      },
    ]);
    expect(backStack(nextStack)).toEqual([home]);
  });

  it("returns a non-home root tab to home instead of exiting", () => {
    const profile: AppRoute = makeRoot("profile");

    expect(backStack([profile])).toEqual([makeRoot("home")]);
  });

  it("opens premium tabs directly only with explicit demonstration access", () => {
    expect(openTabStack([makeRoot("home")], "doctor", true)).toEqual([
      makeRoot("doctor"),
    ]);
  });
});
