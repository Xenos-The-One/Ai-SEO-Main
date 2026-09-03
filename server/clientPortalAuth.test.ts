import { describe, expect, it } from "vitest";
import * as crypto from "crypto";
import { hashPassword, verifyPassword } from "./clientPortalAuth";

describe("client-portal password hashing", () => {
  it("hashes with bcrypt (salted, $2 prefix) and verifies", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("salts — two hashes of the same password differ", async () => {
    expect(await hashPassword("same")).not.toEqual(await hashPassword("same"));
  });

  it("still verifies legacy unsalted SHA-256 hashes (for existing users)", async () => {
    const legacy = crypto.createHash("sha256").update("legacy-pw").digest("hex");
    expect(await verifyPassword("legacy-pw", legacy)).toBe(true);
    expect(await verifyPassword("nope", legacy)).toBe(false);
  });
});
