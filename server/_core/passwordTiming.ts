import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

let dummyHash: Promise<string> | null = null;

/**
 * Spend the same bcrypt work as a real password check when there's no account to check
 * against, so login response time doesn't reveal which emails have accounts.
 */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= bcrypt.hash(randomBytes(16).toString("hex"), 10);
  await bcrypt.compare(password, await dummyHash);
}
