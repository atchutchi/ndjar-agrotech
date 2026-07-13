import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("descreve a autenticação administrativa implementada", () => {
    const html = renderToString(<HomePage />);

    expect(html).toContain("Admin com autenticação protegida");
    expect(html).not.toContain("Admin ainda sem autenticação");
  });
});
