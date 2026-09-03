import { beforeEach, describe, expect, it } from "vitest";
import { router, publicProcedure, rateLimit } from "./trpc";
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
});
