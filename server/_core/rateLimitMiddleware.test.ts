import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { router, publicProcedure, rateLimit, clientIp } from "./trpc";
import { resetRateLimits } from "./rateLimit";

beforeEach(() => resetRateLimits());

const testRouter = router({
  ping: publicProcedure
    .use(rateLimit({ name: "test-mw", limit: 2, windowMs: 60_000 }))
    .query(() => "ok"),
});

function callerFor(userId: number) {
  return testRouter.createCaller({ user: { id: userId }, req: {}, res: {} } as any);
}

describe("rateLimit middleware", () => {
  it("allows up to the limit then throws TOO_MANY_REQUESTS", async () => {
    const caller = callerFor(1);
    expect(await caller.ping()).toBe("ok");
    expect(await caller.ping()).toBe("ok");
    await expect(caller.ping()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("budgets are per-user (separate callers don't share)", async () => {
    const a = callerFor(10);
    const b = callerFor(20);
    await a.ping();
    await a.ping();
    await expect(a.ping()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    // Different user still has a full budget.
    expect(await b.ping()).toBe("ok");
  });

  it("anonymous callers are budgeted per IP", async () => {
    const anon = (ip: string) => testRouter.createCaller({ user: null, req: { ip, headers: {} }, res: {} } as any);
    await anon("1.1.1.1").ping();
    await anon("1.1.1.1").ping();
    await expect(anon("1.1.1.1").ping()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await anon("2.2.2.2").ping()).toBe("ok");
  });
});

describe("clientIp", () => {
  afterEach(() => vi.unstubAllEnvs());
  const req = (headers: Record<string, string>) => ({ ip: "10.0.0.1", headers }) as any;

  it("ignores spoofable forwarding headers off Vercel", () => {
    vi.stubEnv("VERCEL", "");
    expect(clientIp(req({ "x-real-ip": "6.6.6.6", "x-forwarded-for": "6.6.6.6" }))).toBe("10.0.0.1");
  });

  it("uses Vercel's x-real-ip on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    expect(clientIp(req({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
  });
});

describe("assertLoginAttemptAllowed", () => {
  it("allows 10 attempts per email, then blocks that email only", async () => {
    const { assertLoginAttemptAllowed } = await import("./rateLimiters");
    for (let i = 0; i < 10; i++) assertLoginAttemptAllowed("agency", "Owner@Agency.test");
    expect(() => assertLoginAttemptAllowed("agency", "owner@agency.test")).toThrow(/Too many sign-in attempts/);
    // Other emails, and the same email on the portal side, keep their own budgets.
    expect(() => assertLoginAttemptAllowed("agency", "someone@agency.test")).not.toThrow();
    expect(() => assertLoginAttemptAllowed("portal", "owner@agency.test")).not.toThrow();
  });
});
