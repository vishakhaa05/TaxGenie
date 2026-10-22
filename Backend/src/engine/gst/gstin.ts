import { VALID_STATE_CODES, GST_STATES } from "./states";
import { GstinValidationResult } from "./types";

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Calculates the 15th check digit of a 14-character GSTIN prefix using the standard Luhn Mod-36 algorithm.
 */
export function calculateGstinChecksum(gstin14: string): string {
  if (typeof gstin14 !== "string" || gstin14.length < 14) {
    throw new Error("GSTIN prefix must be at least 14 characters long");
  }

  const prefix = gstin14.slice(0, 14).toUpperCase();
  let sum = 0;

  for (let i = 0; i < 14; i++) {
    const char = prefix[i] ?? "";
    const charCode = GSTIN_CHARS.indexOf(char);
    if (charCode === -1) {
      throw new Error(`Invalid character in GSTIN prefix: ${char}`);
    }

    // Alternating weights: 1 for even index (1st, 3rd...), 2 for odd index (2nd, 4th...)
    const weight = i % 2 === 0 ? 1 : 2;
    const product = charCode * weight;
    const quotient = Math.floor(product / 36);
    const remainder = product % 36;
    sum += quotient + remainder;
  }

  const remainder = sum % 36;
  const checkDigitIndex = (36 - remainder) % 36;
  return GSTIN_CHARS[checkDigitIndex] ?? "";
}

/**
 * Generates a valid 15-character GSTIN with an exact computed checksum character.
 * Useful for automated tests and valid test data generation.
 */
export function generateTestGstin(
  stateCode = "27",
  pan = "ABCDE1234F",
  entityNumber = "1"
): string {
  const prefix14 = `${stateCode}${pan.toUpperCase()}${entityNumber}Z`;
  const checksum = calculateGstinChecksum(prefix14);
  return `${prefix14}${checksum}`;
}

/**
 * Validates a 15-character Indian Goods and Services Tax Identification Number (GSTIN).
 * Returns specific failure reason codes:
 * - INVALID_LENGTH: not 15 characters
 * - INVALID_FORMAT: fails regex pattern ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
 * - INVALID_STATE_CODE: first 2 digits do not map to an active Indian State or UT
 * - INVALID_CHECKSUM: 15th check digit does not match mod-36 checksum
 */
export function validateGstin(gstin: unknown): GstinValidationResult {
  if (typeof gstin !== "string") {
    return {
      valid: false,
      reason: "INVALID_FORMAT",
    };
  }

  const trimmed = gstin.trim().toUpperCase();

  // 1. Length check
  if (trimmed.length !== 15) {
    return {
      valid: false,
      reason: "INVALID_LENGTH",
    };
  }

  // 2. Format pattern check
  // Pattern: 2 digits (state) + 5 letters + 4 digits + 1 letter (PAN) + 1 alphanumeric (entity) + 'Z' + 1 checksum
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(trimmed)) {
    return {
      valid: false,
      reason: "INVALID_FORMAT",
    };
  }

  // 3. State code check
  const stateCode = trimmed.slice(0, 2);
  if (!VALID_STATE_CODES.has(stateCode)) {
    return {
      valid: false,
      reason: "INVALID_STATE_CODE",
    };
  }

  // 4. Checksum verification
  const expectedChecksum = calculateGstinChecksum(trimmed.slice(0, 14));
  const actualChecksum = trimmed[14] ?? "";

  if (actualChecksum !== expectedChecksum) {
    return {
      valid: false,
      reason: "INVALID_CHECKSUM",
    };
  }

  const stateObj = GST_STATES.find((s) => s.code === stateCode);

  return {
    valid: true,
    details: {
      stateCode,
      stateName: stateObj?.name,
      pan: trimmed.slice(2, 12),
      entityNumber: trimmed[12] ?? "",
      checksum: actualChecksum,
    },
  };
}
