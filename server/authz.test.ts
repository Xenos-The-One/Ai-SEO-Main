import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock the db module so guards run against a fake query builder we control.
// `isAgencyAdmin` is also sourced from here; default it to non-admin per test.
vi.mock("./db", () => ({ getDb: vi.fn(), isAgencyAdmin: vi.fn() }));
import { getDb, isAgencyAdmin } from "./db";
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
const mockIsAgencyAdmin = isAgencyAdmin as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockGetDb.mockReset();
  mockIsAgencyAdmin.mockReset();
  mockIsAgencyAdmin.mockResolvedValue(false); // default: caller is a non-admin
});

const OWNER = 1;
const OTHER = 2;

const guards: Array<[string, (uid: number, id: number) => Promise<void>]> = [
  ["assertClient", assertClient],
  ["assertContent", assertContent],
  ["assertBrand", assertBrand],
  ["assertContentComment", assertContentComment],
  ["assertBrief", assertBrief],
  ["assertPortalUser", assertPortalUser],
];

describe("ownership guards deny cross-tenant access (non-admin)", () => {
  for (const [name, guard] of guards) {
    it(`${name} throws FORBIDDEN when the row is not owned by the user`, async () => {
      mockGetDb.mockResolvedValue(fakeDb([])); // no matching owned row
      await expect(guard(OTHER, 999)).rejects.toBeInstanceOf(TRPCError);
      await expect(guard(OTHER, 999)).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  }
});

describe("ownership guards allow the owner (non-admin)", () => {
  for (const [name, guard] of guards) {
    it(`${name} resolves when a matching owned row exists`, async () => {
      mockGetDb.mockResolvedValue(fakeDb([{ id: 42 }]));
      await expect(guard(OWNER, 42)).resolves.toBeUndefined();
    });
  }
});

describe("admins bypass ownership and reach any existing row", () => {
  for (const [name, guard] of guards) {
    it(`${name} resolves for an admin even on another user's row`, async () => {
      mockIsAgencyAdmin.mockResolvedValue(true);
      mockGetDb.mockResolvedValue(fakeDb([{ id: 42 }])); // row exists, owned by anyone
      await expect(guard(OTHER, 42)).resolves.toBeUndefined();
    });

    it(`${name} still denies an admin when the row does not exist`, async () => {
      mockIsAgencyAdmin.mockResolvedValue(true);
      mockGetDb.mockResolvedValue(fakeDb([])); // no such row
      await expect(guard(OTHER, 999)).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  }
});
