import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// Encrypt small secrets (e.g. courier API keys) at rest with AES-256-GCM.
// Key is derived from AUTH_SECRET, so keep AUTH_SECRET stable in production.

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHash("sha256").update(secret).digest(); // 32 bytes
}

/** Returns base64 of iv(12) | tag(16) | ciphertext. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/** Mask a secret for display, e.g. "abcd…wxyz". */
export function maskSecret(plain: string): string {
  if (plain.length <= 8) return "••••";
  return `${plain.slice(0, 4)}…${plain.slice(-4)}`;
}
