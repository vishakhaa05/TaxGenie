import { EngineValidationError } from "../shared/errors";
import { roundHalfUp } from "../shared/rounding";

/**
 * Convert Rupees (which may contain up to 2 decimal places) into integer Paise.
 * Uses roundHalfUp to safely convert floating decimal representations.
 */
export function rupeesToPaise(rupees: number): number {
  if (
    typeof rupees !== "number" ||
    Number.isNaN(rupees) ||
    !Number.isFinite(rupees)
  ) {
    throw new EngineValidationError(
      `Invalid rupees amount: ${rupees}`,
      "INVALID_MONEY_AMOUNT"
    );
  }

  return roundHalfUp(rupees * 100);
}

/**
 * Convert integer Paise back into Rupees with 2 decimal places precision.
 */
export function paiseToRupees(paise: number): number {
  if (
    typeof paise !== "number" ||
    Number.isNaN(paise) ||
    !Number.isFinite(paise)
  ) {
    throw new EngineValidationError(
      `Invalid paise amount: ${paise}`,
      "INVALID_PAISE_AMOUNT"
    );
  }

  // Exact 2 decimal places conversion
  return Math.round(paise) / 100;
}

/**
 * Format paise directly as a decimal string e.g. "120.50"
 */
export function formatPaise(paise: number): string {
  return (paiseToRupees(paise)).toFixed(2);
}
