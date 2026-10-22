import { EngineValidationError } from "./errors";

/**
 * Standard Round Half-Up implementation (defined in ONE shared helper).
 * Always rounds values where fractional part >= 0.5 away from zero (towards infinity for positive numbers).
 * Uses Number.EPSILON to guard against binary floating point representation imprecision.
 */
export function roundHalfUp(num: number): number {
  if (typeof num !== "number" || Number.isNaN(num) || !Number.isFinite(num)) {
    throw new EngineValidationError(
      `Cannot round invalid number: ${num}`,
      "INVALID_ROUNDING_TARGET"
    );
  }

  const sign = num < 0 ? -1 : 1;
  const abs = Math.abs(num);
  return sign * Math.floor(abs + 0.5 + Number.EPSILON);
}

/**
 * Round rupees to the nearest multiple of Rs. 10.
 * In Indian Tax law (Sec 288A & 288B of Income Tax Act 1961),
 * taxable income and tax liability are rounded off to the nearest Rs. 10.
 * If the last digit is 5 or more, it rounds up; otherwise it rounds down.
 *
 * Configurable flag in TaxYearRules (defaulting to OFF, with TODO to verify).
 */
export function roundToNearestTen(rupees: number): number {
  if (typeof rupees !== "number" || Number.isNaN(rupees) || !Number.isFinite(rupees)) {
    throw new EngineValidationError(
      `Cannot round invalid rupees to nearest 10: ${rupees}`,
      "INVALID_ROUNDING_TARGET"
    );
  }
  return roundHalfUp(rupees / 10) * 10;
}
