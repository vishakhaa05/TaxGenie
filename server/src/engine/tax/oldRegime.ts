import { EngineValidationError } from "../shared/errors";
import { formatINR } from "../shared/formatINR";
import { roundHalfUp, roundToNearestTen } from "../shared/rounding";
import { calculateHraExemption } from "./hra";
import { calculateSlabTax } from "./slabs";
import {
  TaxInput,
  TaxYearRules,
  RegimeResult,
  TaxStep,
  TaxWarning,
  TaxSlabRule,
} from "./types";

/**
 * Pure Old Tax Regime calculator.
 * Supports statutory deductions (80C, 80CCD(1B), 80D, 24(b) Home Loan, HRA) with individual caps,
 * age-based slabs (below 60, senior 60-80, super-senior 80+), and Section 87A rebate.
 */
export function calculateOldRegime(
  input: TaxInput,
  rules: TaxYearRules
): RegimeResult {
  const { salaryIncome, otherIncome = 0, ageGroup, deductions } = input;

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

  const validAgeGroups = ["below60", "senior", "superSenior"] as const;
  if (!validAgeGroups.includes(ageGroup)) {
    throw new EngineValidationError(
      `Invalid ageGroup: ${ageGroup}. Must be one of: below60, senior, superSenior`,
      "INVALID_AGE_GROUP",
      "ageGroup"
    );
  }

  const warnings: TaxWarning[] = [];
  const steps: TaxStep[] = [];
  const deductionsApplied: Record<string, number> = {};

  // 1. Gross Income
  const grossIncome = salaryIncome + otherIncome;
  steps.push({
    stepKey: "tax.step.grossIncome",
    value: grossIncome,
    formattedValue: formatINR(grossIncome),
    descriptionParams: { salary: salaryIncome, other: otherIncome },
  });

  // 2. Standard Deduction (applies to salary only)
  const standardDeductionCap = rules.oldRegime.standardDeduction;
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

  // 3. Itemized Deductions & Individual Caps
  const limits = rules.oldRegime.deductionLimits;

  // Helper for applying deduction with cap warning
  const applyDeduction = (
    key: string,
    sectionName: string,
    enteredAmt: number | undefined,
    cap: number
  ) => {
    if (enteredAmt === undefined || enteredAmt <= 0) {
      deductionsApplied[key] = 0;
      return 0;
    }
    if (
      typeof enteredAmt !== "number" ||
      Number.isNaN(enteredAmt) ||
      !Number.isFinite(enteredAmt)
    ) {
      throw new EngineValidationError(
        `Deduction ${sectionName} must be a valid number, got: ${enteredAmt}`,
        "INVALID_DEDUCTION_AMOUNT",
        key
      );
    }

    const applied = Math.min(enteredAmt, cap);
    deductionsApplied[key] = applied;

    if (enteredAmt > cap) {
      warnings.push({
        code: "DEDUCTION_CAPPED",
        params: {
          section: sectionName,
          entered: enteredAmt,
          allowed: cap,
        },
      });
    }

    return applied;
  };

  // Section 80C
  applyDeduction(
    "sec80C",
    "80C",
    deductions?.sec80C,
    limits.sec80C
  );

  // Section 80CCD(1B) - NPS additional
  applyDeduction(
    "sec80CCD1B",
    "80CCD(1B)",
    deductions?.sec80CCD1B,
    limits.sec80CCD1B
  );

  // Section 80D (Self & Family)
  const self80DCap =
    ageGroup === "senior" || ageGroup === "superSenior"
      ? limits.sec80D_selfFamily.senior
      : limits.sec80D_selfFamily.normal;
  applyDeduction(
    "sec80D_selfFamily",
    "80D (Self & Family)",
    deductions?.sec80D_selfFamily,
    self80DCap
  );

  // Section 80D (Parents)
  const parents80DCap = deductions?.parentsAreSenior
    ? limits.sec80D_parents.senior
    : limits.sec80D_parents.normal;
  applyDeduction(
    "sec80D_parents",
    "80D (Parents)",
    deductions?.sec80D_parents,
    parents80DCap
  );

  // Section 24(b) Home Loan Interest
  applyDeduction(
    "homeLoanInterest",
    "24(b) Home Loan Interest",
    deductions?.homeLoanInterest,
    limits.homeLoanInterestSelfOccupied
  );

  // HRA Exemption
  let hraExemption = 0;
  if (deductions?.hra) {
    hraExemption = calculateHraExemption(deductions.hra, rules);
    deductionsApplied["hraExemption"] = hraExemption;
  } else {
    deductionsApplied["hraExemption"] = 0;
  }

  const totalOldDeductions =
    (deductionsApplied.sec80C || 0) +
    (deductionsApplied.sec80CCD1B || 0) +
    (deductionsApplied.sec80D_selfFamily || 0) +
    (deductionsApplied.sec80D_parents || 0) +
    (deductionsApplied.homeLoanInterest || 0) +
    (deductionsApplied.hraExemption || 0);

  steps.push({
    stepKey: "tax.step.deductions",
    value: totalOldDeductions,
    formattedValue: formatINR(totalOldDeductions),
  });

  // 4. Taxable Income
  let taxableIncome = Math.max(
    0,
    grossIncome - standardDeductionApplied - totalOldDeductions
  );

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

  // 5. Slab Tax by Age Group
  let slabs: TaxSlabRule[];
  if (ageGroup === "senior") {
    slabs = rules.oldRegime.slabsByAge.senior;
  } else if (ageGroup === "superSenior") {
    slabs = rules.oldRegime.slabsByAge.superSenior;
  } else {
    slabs = rules.oldRegime.slabsByAge.below60;
  }

  const { totalTax: taxBeforeRebate, breakdown: slabBreakdown } =
    calculateSlabTax(taxableIncome, slabs);

  steps.push({
    stepKey: "tax.step.slabTax",
    value: taxBeforeRebate,
    formattedValue: formatINR(taxBeforeRebate),
  });

  // 6. Rebate u/s 87A (Old Regime max Rs 12,500 if taxable income <= Rs 5,00,000)
  const rebateConfig = rules.oldRegime.rebate;
  let rebateApplied = 0;
  let taxAfterRebate = taxBeforeRebate;

  if (taxableIncome <= rebateConfig.incomeLimit) {
    rebateApplied = Math.min(taxBeforeRebate, rebateConfig.maxRebate);
    taxAfterRebate = Math.max(0, taxBeforeRebate - rebateApplied);
    if (rebateApplied > 0) {
      warnings.push({
        code: "REBATE_APPLIED",
        params: { amount: rebateApplied, limit: rebateConfig.incomeLimit },
      });
    }
  }

  steps.push({
    stepKey: "tax.step.rebate",
    value: rebateApplied,
    formattedValue: formatINR(rebateApplied),
  });

  steps.push({
    stepKey: "tax.step.taxAfterRebate",
    value: taxAfterRebate,
    formattedValue: formatINR(taxAfterRebate),
  });

  // 7. Health & Education Cess (4%)
  const cess = roundHalfUp((taxAfterRebate * rules.cess) / 100);
  steps.push({
    stepKey: "tax.step.cess",
    value: cess,
    formattedValue: formatINR(cess),
    descriptionParams: { rate: rules.cess },
  });

  // 8. Total Tax Liability
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
    regime: "old",
    grossIncome,
    standardDeductionApplied,
    deductionsApplied,
    taxableIncome,
    slabBreakdown,
    taxBeforeRebate,
    rebateApplied,
    marginalReliefApplied: 0,
    taxAfterRebate,
    cess,
    totalTax,
    effectiveRatePercent,
    monthlyTax,
    steps,
    warnings,
  };
}
