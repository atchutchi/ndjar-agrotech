import { describe, expect, it } from "vitest";

import { getAppInsets } from "./appInsets";

describe("getAppInsets", () => {
  it("reserves the Android status bar and gesture navigation areas", () => {
    expect(getAppInsets({ platform: "android", statusBarHeight: 28 })).toEqual({
      bottom: 16,
      top: 28,
    });
  });

  it("leaves iOS insets to SafeAreaView", () => {
    expect(getAppInsets({ platform: "ios", statusBarHeight: 0 })).toEqual({
      bottom: 0,
      top: 0,
    });
  });
});
