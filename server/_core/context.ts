import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { COOKIE_NAME, SESSION_REFRESH_AFTER_MS, SESSION_TTL_MS } from "@shared/const";
import type { User } from "../../drizzle/schema";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const { user: authedUser, session } = await sdk.authenticateRequest(opts.req);
    user = authedUser;

    // Sliding session: once the token is older than the refresh threshold, re-issue a
    // fresh one so active users stay signed in while idle sessions still expire. Tokens
    // with no issued-at (legacy format) are treated as stale so they migrate on next use.
    const age = session.issuedAtMs > 0 ? Date.now() - session.issuedAtMs : Infinity;
    if (age > SESSION_REFRESH_AFTER_MS) {
      try {
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          ver: user.tokenVersion ?? 0,
          expiresInMs: SESSION_TTL_MS,
        });
        opts.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(opts.req),
          maxAge: SESSION_TTL_MS,
        });
      } catch (error) {
        // Rotation is best-effort; the existing token is still valid.
        console.warn("[Auth] Failed to rotate session token", String(error));
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
