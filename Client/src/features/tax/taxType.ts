export interface TaxSlab {
  minIncome: number;
  maxIncome: number | null;
  rate: number;
}

export interface TaxSlabConfig {
  financialYear: string;
  assessmentYear: string;
  newRegime: {
    standardDeduction: number;
    rebateMaxIncome: number;
    rebateAmount: number;
    slabs: TaxSlab[];
  };
  oldRegime: {
    standardDeduction: number;
    max80C: number;
    slabs: TaxSlab[];
  };
}

export interface AutoPulledDeductions {
  sec80C: number;
  sec80D: number;
  hraExemption: number;
  homeLoanInterest: number;
  otherDeductions: number;
  totalPulledCount: number;
}

export interface CalculateTaxInput {
  financialYear?: string;
  grossIncome: number;
  isSalaried?: boolean;
  sec80C?: number;
  sec80D?: number;
  hraExemption?: number;
  homeLoanInterest?: number;
  otherDeductions?: number;
}

export interface TaxRegimeBreakdown {
  standardDeduction: number;
  deductions80C?: number;
  deductions80D?: number;
  hraExemption?: number;
  homeLoanInterest?: number;
  otherDeductions?: number;
  totalDeductions?: number;
  taxableIncome: number;
  taxBeforeRebate: number;
  rebate87A: number;
  cess: number;
  totalTaxLiability: number;
}

export interface TaxComparisonResult {
  financialYear: string;
  assessmentYear: string;
  grossIncome: number;
  newRegime: TaxRegimeBreakdown;
  oldRegime: TaxRegimeBreakdown;
  recommendedRegime: "NEW_REGIME" | "OLD_REGIME";
  taxSavings: number;
  summary: string;
}
