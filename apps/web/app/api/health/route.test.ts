import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns the web service health payload", async () => {
    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      service: "@ndjar/web",
      status: "ok",
    });
    expect(response.status).toBe(200);
  });
});
