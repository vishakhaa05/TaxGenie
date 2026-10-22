import { calculateNewRegime } from "./newRegime";
import { calculateOldRegime } from "./oldRegime";
import { TaxInput, TaxYearRules } from "./types";

/**
 * Helper to compute old regime tax with an arbitrary lump-sum deduction.
 * Ignores individual statutory caps (80C, 80D, etc.) and tests the total deduction amount.
 */
function getOldRegimeTaxWithLumpSumDeduction(
  input: TaxInput,
  rules: TaxYearRules,
  lumpSumDeduction: number
): number {
  const customInput: TaxInput = {
    ...input,
    deductions: {
      // Put lump sum into sec80C or an uncapped simulated field
      // We pass it directly by creating custom rules where sec80C cap equals or exceeds lumpSum
      sec80C: lumpSumDeduction,
      sec80CCD1B: 0,
      sec80D_selfFamily: 0,
      sec80D_parents: 0,
      homeLoanInterest: 0,
      hra: undefined,
    },
  };

  const customRules: TaxYearRules = {
    ...rules,
    oldRegime: {
      ...rules.oldRegime,
      deductionLimits: {
        ...rules.oldRegime.deductionLimits,
        sec80C: Math.max(lumpSumDeduction, rules.oldRegime.deductionLimits.sec80C),
      },
    },
  };

  const result = calculateOldRegime(customInput, customRules);
  return result.totalTax;
}

/**
 * Finds the break-even deduction:
 * The total old-regime deductions (as a single lump sum, ignoring individual caps)
 * at which old regime tax becomes <= new regime tax.
 *
 * Uses binary search between 0 and gross income.
 * Returns null if not reachable.
 * Guarantee: applying the returned break-even amount makes old regime <= new regime,
 * while one rupee less (breakEven - 1) makes old regime > new regime.
 */
export function findBreakEvenDeductions(
  input: TaxInput,
  rules: TaxYearRules
): number | null {
  const newRegimeResult = calculateNewRegime(input, rules);
  const targetTax = newRegimeResult.totalTax;

  const grossIncome = input.salaryIncome + (input.otherIncome || 0);

  // If even with 0 deduction, old regime tax is already <= new regime tax
  const taxAtZero = getOldRegimeTaxWithLumpSumDeduction(input, rules, 0);
  if (taxAtZero <= targetTax) {
    return 0;
  }

  // Max possible deduction is gross income
  const taxAtMax = getOldRegimeTaxWithLumpSumDeduction(input, rules, grossIncome);
  if (taxAtMax > targetTax) {
    return null; // Not reachable
  }

  let low = 0;
  let high = grossIncome;
  let breakEven: number | null = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const taxAtMid = getOldRegimeTaxWithLumpSumDeduction(input, rules, mid);

    if (taxAtMid <= targetTax) {
      breakEven = mid;
      high = mid - 1; // Try to find a smaller deduction
    } else {
      low = mid + 1; // Need a larger deduction
    }
  }

  return breakEven;
}
