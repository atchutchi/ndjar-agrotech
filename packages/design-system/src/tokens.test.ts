import { describe, expect, it } from "vitest";

import {
  breakpoints,
  colors,
  designTokens,
  phScale,
  status,
  touchTargets,
} from "./tokens.js";

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

  it("defines pH bands in the order used by the prototype", () => {
    expect(phScale.acid.range).toEqual([0, 5.5]);
    expect(phScale.ideal.range).toEqual([5.5, 7.2]);
    expect(phScale.alkaline.range).toEqual([7.2, 14]);
  });

  it("sets mobile-first interaction and web breakpoint foundations", () => {
    expect(touchTargets.androidMin).toBeGreaterThanOrEqual(48);
    expect(touchTargets.iosMin).toBeGreaterThanOrEqual(44);
    expect(breakpoints.phone).toBe(360);
    expect(breakpoints.desktop).toBe(1040);
    expect(designTokens.colors).toBe(colors);
  });
});
