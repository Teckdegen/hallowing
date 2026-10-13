import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/** Verifies the Privy access token from `Authorization: Bearer` and returns the Privy user id. */
export async function privyUserId(request: Request) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!appId || !token) return null;
  jwks ??= createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`));
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: "privy.io", audience: appId });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
