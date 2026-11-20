import crypto from "crypto";

/**
 * Generate a cryptographically secure 6-digit numeric OTP string
 */
export function generateOtp(): string {
  const number = crypto.randomInt(100000, 1000000);
  return number.toString();
}

/**
 * Compute SHA-256 hash of a string (token, OTP, etc.) for safe storage in database
 */
export function hashSha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Generate a 32-byte secure random hex string for password resets
 */
export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Generate a random UUID string for session family tracking
 */
export function generateFamilyId(): string {
  return crypto.randomUUID();
}
