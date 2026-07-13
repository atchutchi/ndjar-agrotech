import { describe, expect, it } from "vitest";

import {
  backStack,
  makeRoot,
  openTabStack,
  pushRouteStack,
  resumeDemoTargetStack,
  type AppRoute,
} from "./routes";

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
        target: makeRoot("map"),
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

  it("replaces an existing subscription screen instead of accumulating paywalls", () => {
    const firstAttempt = openTabStack([makeRoot("home")], "map", false);

    const secondAttempt = openTabStack(firstAttempt, "doctor", false);

    expect(secondAttempt).toEqual([
      makeRoot("home"),
      {
        name: "subscription",
        params: { targetName: "root", targetTab: "doctor" },
        tab: "home",
        target: makeRoot("doctor"),
      },
    ]);
  });

  it("opens the original route with its parameters after enabling demonstration access", () => {
    const cropRoute: AppRoute = {
      name: "crop",
      params: { cropId: "arroz" },
      tab: "map",
    };
    const gatedStack = pushRouteStack([makeRoot("home")], cropRoute, false);

    expect(resumeDemoTargetStack(gatedStack)).toEqual([
      makeRoot("home"),
      cropRoute,
    ]);
  });
});
