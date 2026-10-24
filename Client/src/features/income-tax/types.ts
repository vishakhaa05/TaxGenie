export type AgeGroup = "below60" | "senior" | "superSenior";

export type SalaryPeriod = "yearly" | "monthly";

export interface TaxSlabRule {
  upTo: number | null;
  rate: number;
  minIncome?: number;
  maxIncome?: number | null;
}

export interface HraRules {
  metroPercent: number;
  nonMetroPercent: number;
  rentMinusBasicPercent: number;
}

export interface DeductionLimits {
  sec80C: number;
  sec80CCD1B: number;
  sec80D_selfFamily: {
    normal: number;
    senior: number;
  };
  sec80D_parents: {
    normal: number;
    senior: number;
  };
  homeLoanInterestSelfOccupied: number;
}

export interface NewRegimeRules {
  slabs: TaxSlabRule[];
  standardDeduction: number;
  rebate: {
    incomeLimit: number;
    maxRebate: number | string;
    marginalRelief: boolean;
  };
}

export interface OldRegimeRules {
  slabsByAge: {
    below60: TaxSlabRule[];
    senior: TaxSlabRule[];
    superSenior: TaxSlabRule[];
  };
  standardDeduction: number;
  rebate: {
    incomeLimit: number;
    maxRebate: number;
  };
  deductionLimits: DeductionLimits;
  hra: HraRules;
}

export interface TaxYearRules {
  taxYear: string;
  financialYear?: string;
  assessmentYear?: string;
  cess: number;
  roundingToNearestTen?: boolean;
  newRegime: NewRegimeRules;
  oldRegime: OldRegimeRules;
  surcharge?: null | { threshold: number; rate: number }[];
}

export interface HraInput {
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  isMetro: boolean;
}

export interface TaxDeductionsInput {
  sec80C?: number;
  sec80CCD1B?: number;
  sec80D_selfFamily?: number;
  sec80D_parents?: number;
  parentsAreSenior?: boolean;
  homeLoanInterest?: number;
  hra?: HraInput;
}

export interface TaxInput {
  ageGroup: AgeGroup;
  salaryIncome: number;
  otherIncome?: number;
  taxYear: string;
  deductions?: TaxDeductionsInput;
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

/**
 * Wizard local form state
 */
export interface IncomeTaxFormData {
  // Step 1
  ageGroup: AgeGroup;
  taxYear: string;

  // Step 2
  salaryPeriod: SalaryPeriod;
  salaryAmount: number; // raw entered value (monthly or yearly)
  otherIncome: number;

  // Step 3
  sec80C: number;
  sec80CCD1B: number;
  sec80D_selfFamily: number;
  sec80D_parents: number;
  parentsAreSenior: boolean;
  homeLoanInterest: number;

  hasHra: boolean;
  hraBasicSalary: number;
  hraReceived: number;
  hraRentPaid: number;
  hraIsMetro: boolean;
}
