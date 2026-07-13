import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), "utf8");
}

describe("mobile accessibility", () => {
  it("announces selected map points, months and crop groups", () => {
    const map = read("../screens/MapScreen.tsx");
    const calendar = read("../screens/AgriculturalCalendarScreen.tsx");

    expect(map).toContain("accessibilityState={{ selected: isSelected }}");
    expect(
      calendar.match(/accessibilityState=\{\{ selected \}\}/g),
    ).toHaveLength(2);
  });

  it("gives the back button a touch target of at least 44 by 44", () => {
    const ui = read("../components/ui.tsx");

    expect(ui).toMatch(/backButton:\s*\{[\s\S]*height: 44,/);
    expect(ui).toMatch(/backButton:\s*\{[\s\S]*width: 44,/);
  });
});
