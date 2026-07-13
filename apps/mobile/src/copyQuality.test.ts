import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceFiles = [
  "navigation/tabs.tsx",
  "screens/AgriculturalCalendarScreen.tsx",
  "screens/DoctorScreen.tsx",
  "screens/ForumScreen.tsx",
  "screens/HomeScreen.tsx",
  "screens/MapScreen.tsx",
  "screens/ProfileScreen.tsx",
];

describe("mobile copy quality", () => {
  it("contains no common UTF-8 mojibake sequences", () => {
    for (const sourceFile of sourceFiles) {
      const contents = readFileSync(resolve(__dirname, sourceFile), "utf8");
      expect(contents, sourceFile).not.toMatch(
        /Ã[\u0080-\u00bf]|Â[\u0080-\u00bf]|â(?:€|€™|€œ|€œ|€“|€”|€¦)/u,
      );
    }
  });

  it("uses the expected Portuguese accents in primary navigation", () => {
    const tabs = readFileSync(
      resolve(__dirname, "navigation/tabs.tsx"),
      "utf8",
    );

    expect(tabs).toContain('label: "Início"');
    expect(tabs).toContain('label: "Médico"');
    expect(tabs).toContain('label: "Fórum"');
  });
});
