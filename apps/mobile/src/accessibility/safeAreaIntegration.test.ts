import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), "utf8");
}

describe("mobile safe area integration", () => {
  it("uses react-native-safe-area-context for real top and bottom insets", () => {
    const app = read("../App.tsx");
    const packageJson = JSON.parse(read("../../package.json")) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies).toHaveProperty(
      "react-native-safe-area-context",
    );
    expect(app).toContain('from "react-native-safe-area-context"');
    expect(app).toContain("<SafeAreaProvider>");
    expect(app).toContain('edges={["top", "bottom"]}');
    expect(app).not.toContain("getAppInsets");
    expect(app).not.toContain("StatusBar.currentHeight");
  });

  it("enables Android edge-to-edge explicitly", () => {
    const appConfig = JSON.parse(read("../../app.json")) as {
      expo: { android: { edgeToEdgeEnabled?: boolean } };
    };

    expect(appConfig.expo.android.edgeToEdgeEnabled).toBe(true);
  });
});
