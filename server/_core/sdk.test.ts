import { beforeAll, describe, expect, it, vi } from "vitest";

// cookieSecret is read from JWT_SECRET at module load, so stub it before importing sdk.
let sdk: typeof import("./sdk").sdk;
beforeAll(async () => {
  vi.stubEnv("JWT_SECRET", "unit-test-session-secret");
  ({ sdk } = await import("./sdk"));
});

describe("session tokens", () => {
  it("round-trips openId, name, and token version", async () => {
    const token = await sdk.createSessionToken("open-abc", { name: "Ada", ver: 3 });
    const session = await sdk.verifySession(token);
    expect(session).not.toBeNull();
    expect(session!.openId).toBe("open-abc");
    expect(session!.name).toBe("Ada");
    expect(session!.ver).toBe(3);
    expect(session!.issuedAtMs).toBeGreaterThan(0);
  });

  it("defaults token version to 0 when unspecified", async () => {
    const token = await sdk.createSessionToken("open-xyz", { name: "Grace" });
    const session = await sdk.verifySession(token);
    expect(session!.ver).toBe(0);
  });

  it("rejects a missing or malformed cookie", async () => {
    expect(await sdk.verifySession(null)).toBeNull();
    expect(await sdk.verifySession(undefined)).toBeNull();
    expect(await sdk.verifySession("not-a-jwt")).toBeNull();
  });

  it("rejects a token with a tampered signature", async () => {
    const token = await sdk.createSessionToken("open-abc", { ver: 1 });
    const parts = token.split(".");
    const forged = `${parts[0]}.${parts[1]}.AAAAinvalidsignatureAAAA`;
    expect(await sdk.verifySession(forged)).toBeNull();
  });
});
