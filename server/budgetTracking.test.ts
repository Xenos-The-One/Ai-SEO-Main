import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

vi.mock("./db", () => ({ getDb: vi.fn() }));
import { getDb } from "./db";
import { assertClientWithinBudget } from "./budgetTracking";

const mockGetDb = getDb as unknown as ReturnType<typeof vi.fn>;

/**
 * Thenable fake that yields queued results in order, so the two sequential queries
 * (load client, then load its content) each get their own result.
 */
function fakeDbSeq(results: unknown[]) {
  let i = 0;
  // The builder is thenable (so `await query` resolves), but the db is NOT — otherwise
  // `await getDb()` would unwrap the thenable instead of returning the db object.
  const builder: any = {
    from: () => builder,
    where: () => builder,
    limit: () => builder,
    then: (resolve: (v: unknown) => void) => resolve(results[i++]),
  };
  return { select: () => builder };
}

beforeEach(() => mockGetDb.mockReset());

describe("assertClientWithinBudget", () => {
  it("allows when spend is under budget", async () => {
    mockGetDb.mockResolvedValue(fakeDbSeq([[{ monthlyBudget: "10.00" }], []]));
    await expect(assertClientWithinBudget(1)).resolves.toBeUndefined();
  });

  it("throws FORBIDDEN when spend has reached budget", async () => {
    // gpt-4o output = $10/1M tokens → 100k output tokens = $1.00, meeting a $1 budget.
    const content = [{ aiModel: "gpt-4o", inputTokens: 0, outputTokens: 100_000 }];
    mockGetDb.mockResolvedValue(fakeDbSeq([[{ monthlyBudget: "1.00" }], content]));
    await expect(assertClientWithinBudget(1)).rejects.toBeInstanceOf(TRPCError);
    mockGetDb.mockResolvedValue(fakeDbSeq([[{ monthlyBudget: "1.00" }], content]));
    await expect(assertClientWithinBudget(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("is unlimited when the client has no budget set", async () => {
    const content = [{ aiModel: "gpt-4o", inputTokens: 0, outputTokens: 5_000_000 }];
    mockGetDb.mockResolvedValue(fakeDbSeq([[{ monthlyBudget: null }], content]));
    await expect(assertClientWithinBudget(1)).resolves.toBeUndefined();
  });
});
