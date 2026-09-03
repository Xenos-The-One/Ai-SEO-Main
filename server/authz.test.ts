import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock the db module so guards run against a fake query builder we control.
vi.mock("./db", () => ({ getDb: vi.fn() }));
import { getDb } from "./db";
import {
  assertBrand,
  assertBrief,
  assertClient,
  assertContent,
  assertContentComment,
  assertPortalUser,
} from "./authz";

/** A chainable drizzle-like builder whose terminal `.limit()` resolves to `rows`. */
function fakeDb(rows: unknown[]) {
  const builder: any = {
    select: () => builder,
    from: () => builder,
    where: () => builder,
    innerJoin: () => builder,
    limit: () => Promise.resolve(rows),
  };
  return builder;
}

const mockGetDb = getDb as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockGetDb.mockReset();
});

const OWNER = 1;
const OTHER = 2;

describe("ownership guards deny cross-tenant access", () => {
  // When the owner-scoped query finds no row, the resource isn't the caller's.
  const denyCases: Array<[string, (uid: number, id: number) => Promise<void>]> = [
    ["assertClient", assertClient],
    ["assertContent", assertContent],
    ["assertBrand", assertBrand],
    ["assertContentComment", assertContentComment],
    ["assertBrief", assertBrief],
    ["assertPortalUser", assertPortalUser],
  ];

  for (const [name, guard] of denyCases) {
    it(`${name} throws FORBIDDEN when the row is not owned by the user`, async () => {
      mockGetDb.mockResolvedValue(fakeDb([])); // no matching owned row
      await expect(guard(OTHER, 999)).rejects.toBeInstanceOf(TRPCError);
      await expect(guard(OTHER, 999)).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  }
});

describe("ownership guards allow the owner", () => {
  const allowCases: Array<[string, (uid: number, id: number) => Promise<void>]> = [
    ["assertClient", assertClient],
    ["assertContent", assertContent],
    ["assertBrand", assertBrand],
    ["assertContentComment", assertContentComment],
    ["assertBrief", assertBrief],
    ["assertPortalUser", assertPortalUser],
  ];

  for (const [name, guard] of allowCases) {
    it(`${name} resolves when a matching owned row exists`, async () => {
      mockGetDb.mockResolvedValue(fakeDb([{ id: 42 }]));
      await expect(guard(OWNER, 42)).resolves.toBeUndefined();
    });
  }
});
