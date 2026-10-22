import { calculateNewRegime } from "./newRegime";
import { calculateOldRegime } from "./oldRegime";
import { findBreakEvenDeductions } from "./breakEven";
import { TaxInput, TaxYearRules, ComparisonResult } from "./types";

/**
 * Pure comparison engine between New and Old Tax Regimes.
 * Computes deterministic tax liabilities, identifies the recommended regime,
 * calculates absolute & percentage tax savings, and discovers the break-even deduction point.
 */
export function compareRegimes(
  input: TaxInput,
  rules: TaxYearRules
): ComparisonResult {
  const newRegime = calculateNewRegime(input, rules);
  const oldRegime = calculateOldRegime(input, rules);

  let recommended: "new" | "old" | "same" = "same";
  if (newRegime.totalTax < oldRegime.totalTax) {
    recommended = "new";
  } else if (oldRegime.totalTax < newRegime.totalTax) {
    recommended = "old";
  }

  const savings = Math.abs(oldRegime.totalTax - newRegime.totalTax);
  const baseline = Math.max(newRegime.totalTax, oldRegime.totalTax);
  const savingsPercent =
    baseline > 0 ? Number(((savings / baseline) * 100).toFixed(2)) : 0;

  const breakEven = findBreakEvenDeductions(input, rules);

  return {
    newRegime,
    oldRegime,
    recommended,
    savings,
    savingsPercent,
    breakEven,
  };
}
