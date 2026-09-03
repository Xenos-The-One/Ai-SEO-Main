import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "./rateLimit";

afterEach(() => resetRateLimits());

describe("checkRateLimit (sliding window)", () => {
  it("allows up to the limit, then blocks", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("k", 3, 60_000, t0).allowed).toBe(true);
    }
    const blocked = checkRateLimit("k", 3, 60_000, t0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it("does not count a blocked attempt (retry stays bounded by the window)", () => {
    const t0 = 2_000_000;
    checkRateLimit("k", 1, 10_000, t0); // uses the one slot
    checkRateLimit("k", 1, 10_000, t0 + 5_000); // blocked
    // 3s later, still within the original window -> retry ~ remaining of first slot
    const r = checkRateLimit("k", 1, 10_000, t0 + 8_000);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSeconds).toBe(2); // 10s window - 8s elapsed
  });

  it("allows again once the window has passed", () => {
    const t0 = 3_000_000;
    expect(checkRateLimit("k", 1, 10_000, t0).allowed).toBe(true);
    expect(checkRateLimit("k", 1, 10_000, t0 + 5_000).allowed).toBe(false);
    expect(checkRateLimit("k", 1, 10_000, t0 + 10_001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const t0 = 4_000_000;
    expect(checkRateLimit("a", 1, 60_000, t0).allowed).toBe(true);
    expect(checkRateLimit("a", 1, 60_000, t0).allowed).toBe(false);
    expect(checkRateLimit("b", 1, 60_000, t0).allowed).toBe(true);
  });
});
