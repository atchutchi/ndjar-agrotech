import { SignJWT, jwtVerify } from "jose";

export interface AccessTokenPayload {
  sub: string;
  roles: string[];
}

function secretFromEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return new TextEncoder().encode(value);
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return new SignJWT({ roles: payload.roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretFromEnv("JWT_ACCESS_SECRET"));
}

export async function verifyAccessToken(token: string) {
  const result = await jwtVerify(token, secretFromEnv("JWT_ACCESS_SECRET"));

  return {
    roles: Array.isArray(result.payload.roles)
      ? result.payload.roles.map(String)
      : [],
    sub: result.payload.sub ?? "",
  };
}
