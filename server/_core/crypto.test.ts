import { beforeAll, describe, expect, it } from "vitest";

// Must be set before importing the module (getKey reads it at call time, but be explicit).
process.env.ENCRYPTION_KEY = "unit-test-encryption-key";

import { decryptSecret, encryptSecret, isEncrypted } from "./crypto";

describe("crypto secret encryption", () => {
  it("round-trips a secret", () => {
    const plain = "sup3r-secret-website-pw!";
    const enc = encryptSecret(plain);
    expect(enc).not.toBeNull();
    expect(enc).not.toEqual(plain);
    expect(isEncrypted(enc)).toBe(true);
    expect(decryptSecret(enc)).toEqual(plain);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    expect(encryptSecret("same")).not.toEqual(encryptSecret("same"));
  });

  it("is idempotent — never double-encrypts", () => {
    const once = encryptSecret("hello");
    expect(encryptSecret(once)).toEqual(once);
  });

  it("passes through null and empty unchanged", () => {
    expect(encryptSecret(null)).toBeNull();
    expect(encryptSecret("")).toBe("");
    expect(decryptSecret(null)).toBeNull();
    expect(decryptSecret("")).toBe("");
  });

  it("returns legacy plaintext (no prefix) as-is on decrypt", () => {
    expect(decryptSecret("legacy-plaintext-password")).toEqual("legacy-plaintext-password");
  });

  it("fails closed (null) on tampered ciphertext", () => {
    const enc = encryptSecret("secret")!;
    const tampered = enc.slice(0, -4) + "AAAA";
    expect(decryptSecret(tampered)).toBeNull();
  });
});
