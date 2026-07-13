import { afterEach, describe, expect, it } from "vitest";

import { isSameOriginRequest } from "./admin-origin";

const originalEnvironment = {
  nodeEnvironment: process.env.NODE_ENV,
  publicOrigin: process.env.NDJAR_PUBLIC_ORIGIN,
  trustProxyHeaders: process.env.NDJAR_TRUST_PROXY_HEADERS,
};

function request(
  origin: string,
  forwardedHeaders: Record<string, string> = {},
) {
  return new Request("http://web-internal:3000/api/admin/login", {
    headers: { origin, ...forwardedHeaders },
    method: "POST",
  });
}

afterEach(() => {
  restoreEnvironment("NODE_ENV", originalEnvironment.nodeEnvironment);
  restoreEnvironment("NDJAR_PUBLIC_ORIGIN", originalEnvironment.publicOrigin);
  restoreEnvironment(
    "NDJAR_TRUST_PROXY_HEADERS",
    originalEnvironment.trustProxyHeaders,
  );
});

describe("isSameOriginRequest", () => {
  it("usa a origem pública canónica quando o URL interno é diferente", () => {
    process.env.NDJAR_PUBLIC_ORIGIN = "https://admin.example.test";

    expect(isSameOriginRequest(request("https://admin.example.test"))).toBe(
      true,
    );
    expect(isSameOriginRequest(request("https://malicious.example.test"))).toBe(
      false,
    );
  });

  it("aceita cabeçalhos do proxy apenas quando a confiança é explícita", () => {
    delete process.env.NDJAR_PUBLIC_ORIGIN;
    restoreEnvironment("NODE_ENV", "development");
    const forwardedHeaders = {
      "x-forwarded-host": "admin.example.test",
      "x-forwarded-proto": "https",
    };

    expect(
      isSameOriginRequest(
        request("https://admin.example.test", forwardedHeaders),
      ),
    ).toBe(false);

    process.env.NDJAR_TRUST_PROXY_HEADERS = "true";
    expect(
      isSameOriginRequest(
        request("https://admin.example.test", forwardedHeaders),
      ),
    ).toBe(true);
  });

  it("falha fechada em produção sem origem canónica ou proxy confiado", () => {
    delete process.env.NDJAR_PUBLIC_ORIGIN;
    delete process.env.NDJAR_TRUST_PROXY_HEADERS;
    restoreEnvironment("NODE_ENV", "production");

    expect(isSameOriginRequest(request("http://web-internal:3000"))).toBe(
      false,
    );
  });
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
