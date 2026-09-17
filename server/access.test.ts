import { describe, expect, it } from "vitest";
import { canAccessAllData, ownScope } from "./access";
import { clients } from "../drizzle/schema";

/**
 * The agency access model: admins (owners/staff) see and manage every row; non-admins
 * are limited to rows they created. `ownScope` returns `undefined` for admins so drizzle
 * applies no `createdBy` restriction, and a real condition for everyone else.
 */
describe("agency access model", () => {
  const admin = { id: 20, role: "admin" };
  const member = { id: 1158, role: "admin" };
  const regular = { id: 7, role: "user" };

  it("treats admins as able to access all data", () => {
    expect(canAccessAllData(admin)).toBe(true);
    expect(canAccessAllData(regular)).toBe(false);
  });

  it("applies no createdBy restriction for admins", () => {
    expect(ownScope(admin, clients.createdBy)).toBeUndefined();
  });

  it("restricts non-admins to their own rows", () => {
    expect(ownScope(regular, clients.createdBy)).toBeDefined();
  });

  it("lets two admins see the same shared data (both unrestricted)", () => {
    expect(ownScope(admin, clients.createdBy)).toBeUndefined();
    expect(ownScope(member, clients.createdBy)).toBeUndefined();
  });
});
