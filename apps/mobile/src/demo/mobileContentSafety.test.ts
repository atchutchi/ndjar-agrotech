import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), "utf8");
}

describe("mobile demonstration content", () => {
  it("does not show invented regional compatibility percentages", () => {
    const mapScreen = read("../screens/MapScreen.tsx");
    const normalizedMapScreen = mapScreen.replace(/\s+/g, " ");

    expect(mapScreen).not.toContain("[80, 78, 55, 20]");
    expect(mapScreen).toContain("Dados ilustrativos");
    expect(normalizedMapScreen).toContain(
      "não representa uma avaliação regional",
    );
  });

  it("shows calendar entries as sourced reference activities", () => {
    const calendar = read("../screens/AgriculturalCalendarScreen.tsx");

    expect(calendar).toContain("Actividade de referência");
    expect(calendar).toContain("selectedGroup.sourceLabel");
    expect(calendar).not.toContain("Acção recomendada agora");
  });

  it("uses correct visible Portuguese accents", () => {
    const tabs = read("../navigation/tabs.tsx");
    const forum = read("../screens/ForumScreen.tsx");

    expect(tabs).toContain('label: "Início"');
    expect(tabs).toContain('label: "Fórum"');
    expect(forum).toContain("Mandioca não cresce");
    expect(forum).toContain("calendário");
    expect(forum).toContain("comentários, preços");
  });

  it("documents that the presentation APK is not a signed release", () => {
    const buildNotes = read("../../BUILD.md");

    expect(buildNotes).toContain("APK de apresentação");
    expect(buildNotes).toContain("assinatura de depuração");
    expect(buildNotes).toContain("não é uma release assinada");
  });

  it("keeps forum replies in an honest local editor on the selected topic", () => {
    const forum = read("../screens/ForumScreen.tsx");

    expect(forum).toContain("showReplyEditor");
    expect(forum).toContain("Guardar resposta temporária");
    expect(forum).toContain("Resposta guardada apenas nesta sessão");
    expect(forum).not.toContain('navigate("root", undefined, "doctor")');
  });
});
