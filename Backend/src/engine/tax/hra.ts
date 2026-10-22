import { EngineValidationError } from "../shared/errors";
import { roundHalfUp } from "../shared/rounding";
import { HraInput, TaxYearRules } from "./types";

/**
 * Pure HRA (House Rent Allowance) exemption calculator under Section 10(13A).
 * All monetary amounts are in whole rupees.
 *
 * Exemption is the minimum of three statutory conditions:
 * 1. Actual HRA received
 * 2. Rent paid minus 10% of basic salary (cannot be negative)
 * 3. 50% of basic salary (for metro cities: Delhi, Mumbai, Kolkata, Chennai) or 40% (non-metro)
 */
export function calculateHraExemption(
  input: HraInput,
  rules: TaxYearRules
): number {
  const { basicSalary, hraReceived, rentPaid, isMetro } = input;

  if (
    typeof basicSalary !== "number" ||
    Number.isNaN(basicSalary) ||
    !Number.isFinite(basicSalary) ||
    basicSalary < 0
  ) {
    throw new EngineValidationError(
      `Basic salary must be a non-negative finite number, got: ${basicSalary}`,
      "INVALID_BASIC_SALARY",
      "basicSalary"
    );
  }

  if (
    typeof hraReceived !== "number" ||
    Number.isNaN(hraReceived) ||
    !Number.isFinite(hraReceived) ||
    hraReceived < 0
  ) {
    throw new EngineValidationError(
      `HRA received must be a non-negative finite number, got: ${hraReceived}`,
      "INVALID_HRA_RECEIVED",
      "hraReceived"
    );
  }

  if (
    typeof rentPaid !== "number" ||
    Number.isNaN(rentPaid) ||
    !Number.isFinite(rentPaid) ||
    rentPaid < 0
  ) {
    throw new EngineValidationError(
      `Rent paid must be a non-negative finite number, got: ${rentPaid}`,
      "INVALID_RENT_PAID",
      "rentPaid"
    );
  }

  if (hraReceived === 0 || rentPaid === 0 || basicSalary === 0) {
    return 0;
  }

  const hraRules = rules.oldRegime.hra;
  const basicThreshold = roundHalfUp(
    (basicSalary * hraRules.rentMinusBasicPercent) / 100
  );
  const excessRent = Math.max(0, rentPaid - basicThreshold);

  const salaryPercentage = isMetro
    ? hraRules.metroPercent
    : hraRules.nonMetroPercent;
  const salaryCap = roundHalfUp((basicSalary * salaryPercentage) / 100);

  const exemption = Math.min(hraReceived, excessRent, salaryCap);
  return Math.max(0, exemption);
}
