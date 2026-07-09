import { describe, expect, it } from "vitest";

import {
  breakpoints,
  colors,
  designTokens,
  phScale,
  status,
  touchTargets,
} from "./tokens.js";

type TestPhScaleBand =
  | {
      kind: "range";
      range: readonly [number, number];
      lowerBound: "inclusive" | "exclusive";
      upperBound: "inclusive" | "exclusive";
    }
  | {
      kind: "point";
      value: number;
    };

function includesPhValue(band: TestPhScaleBand, value: number): boolean {
  if (band.kind === "point") {
    return value === band.value;
  }

  const [min, max] = band.range;
  const aboveLower =
    band.lowerBound === "exclusive" ? value > min : value >= min;
  const belowUpper =
    band.upperBound === "exclusive" ? value < max : value <= max;

  return aboveLower && belowUpper;
}

describe("N'djar design tokens", () => {
  it("keeps the MVP colour foundation aligned with mobile and web surfaces", () => {
    expect(colors.brand.dark).toBe("#0E3C1D");
    expect(colors.brand.action).toBe("#358439");
    expect(colors.surface.default).toBe("#FFFFFF");
    expect(colors.surface.app).toBe("#F5F7F2");
    expect(colors.border.default).toBe("#DDE5DA");
    expect(colors.data.soil).toBe("#7A3B22");
    expect(colors.data.community).toBe("#2E63E6");
  });

  it("provides semantic state tokens with text labels and accessible intent", () => {
    expect(status.success.label).toBe("Bom");
    expect(status.warning.color).toBe("#F49F0E");
    expect(status.danger.label).toBe("Inadequado");
    expect(status.info.color).toBe("#2E63E6");
  });

  it("exposes every required token category through designTokens", () => {
    expect(Object.keys(designTokens)).toEqual([
      "colors",
      "typography",
      "spacing",
      "radius",
      "status",
      "phScale",
      "elevation",
      "breakpoints",
      "touchTargets",
      "components",
    ]);
  });

  it("defines pH bands in the order and limits used by @ndjar/domain", () => {
    expect(Object.keys(phScale)).toEqual([
      "acidic",
      "favorable",
      "nearNeutral",
      "neutral",
      "alkaline",
    ]);

    expect(phScale.acidic.range).toEqual([0, 5.6]);
    expect(phScale.acidic.upperBound).toBe("exclusive");

    expect(phScale.favorable.range).toEqual([5.6, 6.5]);
    expect(phScale.favorable.lowerBound).toBe("inclusive");
    expect(phScale.favorable.upperBound).toBe("inclusive");

    expect(phScale.nearNeutral.range).toEqual([6.5, 7]);
    expect(phScale.nearNeutral.lowerBound).toBe("exclusive");
    expect(phScale.nearNeutral.upperBound).toBe("exclusive");

    expect(phScale.neutral.kind).toBe("point");
    expect(phScale.neutral.value).toBe(7);

    expect(phScale.alkaline.range).toEqual([7, 14]);
    expect(phScale.alkaline.lowerBound).toBe("exclusive");
  });

  it("does not classify pH values above 7 as ideal or favorable", () => {
    expect("ideal" in phScale).toBe(false);
    expect(includesPhValue(phScale.favorable, 7.01)).toBe(false);
    expect(includesPhValue(phScale.alkaline, 7.01)).toBe(true);
  });

  it("sets mobile-first interaction and web breakpoint foundations", () => {
    expect(touchTargets.androidMin).toBeGreaterThanOrEqual(48);
    expect(touchTargets.iosMin).toBeGreaterThanOrEqual(44);
    expect(breakpoints.phone).toBe(360);
    expect(breakpoints.desktop).toBe(1040);
    expect(designTokens.colors).toBe(colors);
  });
});
