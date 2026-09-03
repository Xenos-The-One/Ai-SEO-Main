import crypto from "crypto";
import { ENV } from "./env";

/**
 * Symmetric encryption for secrets stored at rest (e.g. a client's website password).
 *
 * Values are stored as `enc:v1:<base64(iv|tag|ciphertext)>`. Reads tolerate legacy
 * plaintext (no prefix) so existing rows keep working until they are next written,
 * and encryption is idempotent so double-encrypting is a no-op.
 */
const ALGO = "aes-256-gcm";
const PREFIX = "enc:v1:";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  // Dedicated key if provided, otherwise derive from the app's session secret.
  const secret = (process.env.ENCRYPTION_KEY || ENV.cookieSecret || "").trim();
  if (!secret) {
    throw new Error(
      "Cannot encrypt/decrypt secrets: set ENCRYPTION_KEY (or JWT_SECRET) in the environment."
    );
  }
  return crypto.createHash("sha256").update(secret).digest(); // 32 bytes for aes-256
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/** Encrypt a secret for storage. Returns null/"" unchanged and never double-encrypts. */
export function encryptSecret(plain: string | null | undefined): string | null {
  if (plain == null || plain === "") return plain ?? null;
  if (isEncrypted(plain)) return plain;
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

/** Decrypt a stored secret. Legacy plaintext (no prefix) is returned as-is. */
export function decryptSecret(value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  if (!isEncrypted(value)) return value; // legacy plaintext
  try {
    const raw = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, IV_LEN);
    const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = raw.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    // Wrong key or tampered ciphertext — fail closed rather than leak garbage.
    return null;
  }
}
