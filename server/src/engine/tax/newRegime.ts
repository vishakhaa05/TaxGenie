import { EngineValidationError } from "../shared/errors";
import { formatINR } from "../shared/formatINR";
import { roundHalfUp, roundToNearestTen } from "../shared/rounding";
import { calculateSlabTax } from "./slabs";
import {
  TaxInput,
  TaxYearRules,
  RegimeResult,
  TaxStep,
  TaxWarning,
} from "./types";

/**
 * Pure New Tax Regime calculator (Section 115BAC).
 * Slabs, limits, and thresholds come entirely from the rules object.
 * All internal arithmetic operates strictly on whole rupees.
 */
export function calculateNewRegime(
  input: TaxInput,
  rules: TaxYearRules
): RegimeResult {
  const { salaryIncome, otherIncome = 0 } = input;

  if (
    typeof salaryIncome !== "number" ||
    Number.isNaN(salaryIncome) ||
    !Number.isFinite(salaryIncome) ||
    salaryIncome < 0
  ) {
    throw new EngineValidationError(
      `Salary income must be a non-negative finite number, got: ${salaryIncome}`,
      "INVALID_SALARY_INCOME",
      "salaryIncome"
    );
  }

  if (
    typeof otherIncome !== "number" ||
    Number.isNaN(otherIncome) ||
    !Number.isFinite(otherIncome) ||
    otherIncome < 0
  ) {
    throw new EngineValidationError(
      `Other income must be a non-negative finite number, got: ${otherIncome}`,
      "INVALID_OTHER_INCOME",
      "otherIncome"
    );
  }

  const warnings: TaxWarning[] = [];
  const steps: TaxStep[] = [];

  // 1. Gross Income
  const grossIncome = salaryIncome + otherIncome;
  steps.push({
    stepKey: "tax.step.grossIncome",
    value: grossIncome,
    formattedValue: formatINR(grossIncome),
    descriptionParams: { salary: salaryIncome, other: otherIncome },
  });

  // 2. Standard Deduction (applies to salary only)
  const standardDeductionCap = rules.newRegime.standardDeduction;
  const standardDeductionApplied = Math.min(standardDeductionCap, salaryIncome);

  if (salaryIncome === 0 && otherIncome > 0) {
    warnings.push({
      code: "OTHER_INCOME_NO_STANDARD_DEDUCTION",
      params: { otherIncome },
    });
  }

  steps.push({
    stepKey: "tax.step.standardDeduction",
    value: standardDeductionApplied,
    formattedValue: formatINR(standardDeductionApplied),
    descriptionParams: { limit: standardDeductionCap },
  });

  // 3. Taxable Income
  let taxableIncome = Math.max(0, grossIncome - standardDeductionApplied);
  if (rules.roundingToNearestTen) {
    taxableIncome = roundToNearestTen(taxableIncome);
  }

  steps.push({
    stepKey: "tax.step.taxableIncome",
    value: taxableIncome,
    formattedValue: formatINR(taxableIncome),
  });

  // Surcharge warning for income > 50 Lakhs (not implemented in v1)
  if (taxableIncome > 5000000) {
    warnings.push({
      code: "SURCHARGE_NOT_INCLUDED",
      params: { threshold: 5000000 },
    });
  }

  // 4. Slab Tax Calculation
  const { totalTax: taxBeforeRebate, breakdown: slabBreakdown } =
    calculateSlabTax(taxableIncome, rules.newRegime.slabs);

  steps.push({
    stepKey: "tax.step.slabTax",
    value: taxBeforeRebate,
    formattedValue: formatINR(taxBeforeRebate),
  });

  // 5. Rebate u/s 87A and Marginal Relief
  const rebateConfig = rules.newRegime.rebate;
  let rebateApplied = 0;
  let marginalReliefApplied = 0;
  let taxAfterRebate = taxBeforeRebate;

  if (taxableIncome <= rebateConfig.incomeLimit) {
    // Zero tax payable when taxable income is within rebate threshold
    rebateApplied = taxBeforeRebate;
    taxAfterRebate = 0;
    if (rebateApplied > 0) {
      warnings.push({
        code: "REBATE_APPLIED",
        params: { amount: rebateApplied, limit: rebateConfig.incomeLimit },
      });
    }
  } else if (rebateConfig.marginalRelief) {
    // Marginal relief: tax payable before cess cannot exceed excess income over threshold
    const excessIncome = taxableIncome - rebateConfig.incomeLimit;
    if (taxBeforeRebate > excessIncome) {
      marginalReliefApplied = taxBeforeRebate - excessIncome;
      taxAfterRebate = excessIncome;
      warnings.push({
        code: "MARGINAL_RELIEF_APPLIED",
        params: { relief: marginalReliefApplied, excessIncome },
      });
    }
  }

  steps.push({
    stepKey: "tax.step.rebate",
    value: rebateApplied,
    formattedValue: formatINR(rebateApplied),
  });

  if (marginalReliefApplied > 0) {
    steps.push({
      stepKey: "tax.step.marginalRelief",
      value: marginalReliefApplied,
      formattedValue: formatINR(marginalReliefApplied),
    });
  }

  steps.push({
    stepKey: "tax.step.taxAfterRebate",
    value: taxAfterRebate,
    formattedValue: formatINR(taxAfterRebate),
  });

  // 6. Health & Education Cess (4%)
  const cess = roundHalfUp((taxAfterRebate * rules.cess) / 100);
  steps.push({
    stepKey: "tax.step.cess",
    value: cess,
    formattedValue: formatINR(cess),
    descriptionParams: { rate: rules.cess },
  });

  // 7. Total Tax Liability
  let totalTax = taxAfterRebate + cess;
  if (rules.roundingToNearestTen) {
    totalTax = roundToNearestTen(totalTax);
  }

  steps.push({
    stepKey: "tax.step.totalTax",
    value: totalTax,
    formattedValue: formatINR(totalTax),
  });

  const effectiveRatePercent =
    grossIncome > 0
      ? Number(((totalTax / grossIncome) * 100).toFixed(2))
      : 0;

  const monthlyTax = roundHalfUp(totalTax / 12);

  return {
    regime: "new",
    grossIncome,
    standardDeductionApplied,
    deductionsApplied: {},
    taxableIncome,
    slabBreakdown,
    taxBeforeRebate,
    rebateApplied,
    marginalReliefApplied,
    taxAfterRebate,
    cess,
    totalTax,
    effectiveRatePercent,
    monthlyTax,
    steps,
    warnings,
  };
}
