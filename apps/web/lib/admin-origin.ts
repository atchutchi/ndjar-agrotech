export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  const requestOrigin = getPublicRequestOrigin(request);
  const browserOrigin = parseHttpOrigin(origin);
  if (!requestOrigin || !browserOrigin) {
    return false;
  }

  return browserOrigin === requestOrigin;
}

export function getPublicRequestOrigin(request: Request) {
  const configuredOrigin = process.env.NDJAR_PUBLIC_ORIGIN?.trim();
  if (configuredOrigin) {
    return parseHttpOrigin(configuredOrigin);
  }

  if (process.env.NDJAR_TRUST_PROXY_HEADERS === "true") {
    const protocol = firstForwardedValue(
      request.headers.get("x-forwarded-proto"),
    );
    const host = firstForwardedValue(request.headers.get("x-forwarded-host"));
    if (protocol && host) {
      return parseHttpOrigin(`${protocol}://${host}`);
    }
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return parseHttpOrigin(request.url);
}

function firstForwardedValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || null;
}

function parseHttpOrigin(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    if (url.username || url.password) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}
