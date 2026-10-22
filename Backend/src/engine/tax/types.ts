/**
 * Pure calculation engine types for Indian Income Tax (New vs Old Regime).
 * Designed for strict TypeScript compliance and pure deterministic calculations.
 */

export type AgeGroup = "below60" | "senior" | "superSenior";

export interface TaxSlabRule {
  upTo: number | null; // null represents infinity / above the slab threshold
  rate: number; // Slab tax rate as percentage (e.g. 0, 5, 10, 15, 20, 25, 30)
}

export interface HraRules {
  metroPercent: number; // e.g. 50
  nonMetroPercent: number; // e.g. 40
  rentMinusBasicPercent: number; // e.g. 10
}

export interface DeductionLimits {
  sec80C: number; // e.g. 150000
  sec80CCD1B: number; // e.g. 50000
  sec80D_selfFamily: {
    normal: number; // e.g. 25000
    senior: number; // e.g. 50000 (TODO verify)
  };
  sec80D_parents: {
    normal: number; // e.g. 25000
    senior: number; // e.g. 50000 (TODO verify)
  };
  homeLoanInterestSelfOccupied: number; // e.g. 200000
}

export interface NewRegimeRules {
  slabs: TaxSlabRule[];
  standardDeduction: number; // e.g. 75000
  rebate: {
    incomeLimit: number; // e.g. 1200000
    maxRebate: number | "equal to tax payable up to the limit";
    marginalRelief: boolean;
  };
}

export interface OldRegimeRules {
  slabsByAge: {
    below60: TaxSlabRule[];
    senior: TaxSlabRule[]; // 60 to below 80 (TODO verify on incometax.gov.in)
    superSenior: TaxSlabRule[]; // 80 and above (TODO verify on incometax.gov.in)
  };
  standardDeduction: number; // e.g. 50000
  rebate: {
    incomeLimit: number; // e.g. 500000
    maxRebate: number; // e.g. 12500 (TODO verify on incometax.gov.in)
  };
  deductionLimits: DeductionLimits;
  hra: HraRules;
}
import type { GstRulesConfig } from "../gst/types";

export interface TaxYearRules {
  taxYear: string; // e.g. "2026-27"
  cess: number; // Health & Education Cess percentage (e.g. 4)
  roundingToNearestTen?: boolean | undefined; // Flag to round taxable income & tax to nearest Rs 10 (defaults to false, TODO: verify on incometax.gov.in)
  newRegime: NewRegimeRules;
  oldRegime: OldRegimeRules;
  gst?: GstRulesConfig | undefined;
  surcharge?: null | { threshold: number; rate: number }[] | undefined; // NOT implemented in v1. Engine emits warning above 50L.
}

export interface HraInput {
  basicSalary: number; // whole rupees
  hraReceived: number; // whole rupees
  rentPaid: number; // whole rupees
  isMetro: boolean;
}

export interface TaxDeductionsInput {
  sec80C?: number | undefined;
  sec80CCD1B?: number | undefined;
  sec80D_selfFamily?: number | undefined;
  sec80D_parents?: number | undefined;
  parentsAreSenior?: boolean | undefined;
  homeLoanInterest?: number | undefined;
  hra?: HraInput | undefined;
}

export interface TaxInput {
  ageGroup: AgeGroup;
  salaryIncome: number; // annual, whole rupees
  otherIncome?: number | undefined; // interest, dividends, etc. (whole rupees, default 0)
  deductions?: TaxDeductionsInput | undefined;
  taxYear: string;
}

export interface SlabBreakdownItem {
  from: number;
  upTo: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface TaxStep {
  stepKey: string;
  value: number;
  formattedValue: string;
  descriptionParams?: Record<string, any>;
}

export type TaxWarningCode =
  | "DEDUCTION_CAPPED"
  | "SURCHARGE_NOT_INCLUDED"
  | "REBATE_APPLIED"
  | "MARGINAL_RELIEF_APPLIED"
  | "OTHER_INCOME_NO_STANDARD_DEDUCTION";

export interface TaxWarning {
  code: TaxWarningCode;
  params?: Record<string, any>;
}

export interface RegimeResult {
  regime: "new" | "old";
  grossIncome: number;
  standardDeductionApplied: number;
  deductionsApplied: Record<string, number>;
  taxableIncome: number;
  slabBreakdown: SlabBreakdownItem[];
  taxBeforeRebate: number;
  rebateApplied: number;
  marginalReliefApplied: number;
  taxAfterRebate: number;
  cess: number;
  totalTax: number;
  effectiveRatePercent: number;
  monthlyTax: number;
  steps: TaxStep[];
  warnings: TaxWarning[];
}

export interface ComparisonResult {
  newRegime: RegimeResult;
  oldRegime: RegimeResult;
  recommended: "new" | "old" | "same";
  savings: number;
  savingsPercent: number;
  breakEven: number | null;
}
