import { COOKIE_NAME, SESSION_TTL_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

// Stable application identifier embedded in the session token.
const APP_ID = ENV.appId || "ai-seo-portal";

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
  /** Token version — must match the user's current tokenVersion or the session is revoked. */
  ver: number;
};

export type VerifiedSession = SessionPayload & {
  /** Issued-at, in ms since epoch (used to decide when to rotate). */
  issuedAtMs: number;
};

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  /**
   * Create a signed session token for a user's openId.
   * @example const sessionToken = await sdk.createSessionToken(user.openId, { name });
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string; ver?: number } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: APP_ID,
        name: options.name || "",
        ver: options.ver ?? 0,
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? SESSION_TTL_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
      ver: payload.ver,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(Math.floor(issuedAt / 1000))
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<VerifiedSession | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name, ver, iat } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId) || !isNonEmptyString(appId)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        openId,
        appId,
        name: isNonEmptyString(name) ? name : "",
        ver: typeof ver === "number" ? ver : 0,
        issuedAtMs: typeof iat === "number" ? iat * 1000 : 0,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Authenticate a request and return the user plus the verified session claims.
   * Enforces token-version revocation: a token whose `ver` no longer matches the
   * user's current tokenVersion (e.g. after "log out everywhere") is rejected.
   */
  async authenticateRequest(req: Request): Promise<{ user: User; session: VerifiedSession }> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserByOpenId(session.openId);
    if (!user) {
      throw ForbiddenError("User not found");
    }

    if ((user.tokenVersion ?? 0) !== session.ver) {
      throw ForbiddenError("Session has been revoked");
    }

    // Best-effort touch of last-seen; never block the request on it.
    try {
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    } catch (error) {
      console.warn("[Auth] Failed to update lastSignedIn", String(error));
    }

    return { user, session };
  }
}

export const sdk = new SDKServer();
