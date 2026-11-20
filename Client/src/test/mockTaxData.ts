import { TaxYearRules, ComparisonResult } from "../features/income-tax/types";

export const MOCK_TAX_RULES: TaxYearRules = {
  taxYear: "2026-27",
  financialYear: "2026-2027",
  assessmentYear: "2027-2028",
  cess: 4,
  roundingToNearestTen: false,
  newRegime: {
    slabs: [
      { upTo: 400000, rate: 0, minIncome: 0, maxIncome: 400000 },
      { upTo: 800000, rate: 5, minIncome: 400000, maxIncome: 800000 },
      { upTo: 1200000, rate: 10, minIncome: 800000, maxIncome: 1200000 },
      { upTo: 1600000, rate: 15, minIncome: 1200000, maxIncome: 1600000 },
      { upTo: 2000000, rate: 20, minIncome: 1600000, maxIncome: 2000000 },
      { upTo: 2400000, rate: 25, minIncome: 2000000, maxIncome: 2400000 },
      { upTo: null, rate: 30, minIncome: 2400000, maxIncome: null },
    ],
    standardDeduction: 75000,
    rebate: {
      incomeLimit: 1200000,
      maxRebate: "equal to tax payable up to the limit",
      marginalRelief: true,
    },
  },
  oldRegime: {
    slabsByAge: {
      below60: [
        { upTo: 250000, rate: 0, minIncome: 0, maxIncome: 250000 },
        { upTo: 500000, rate: 5, minIncome: 250000, maxIncome: 500000 },
        { upTo: 1000000, rate: 20, minIncome: 500000, maxIncome: 1000000 },
        { upTo: null, rate: 30, minIncome: 1000000, maxIncome: null },
      ],
      senior: [
        { upTo: 300000, rate: 0, minIncome: 0, maxIncome: 300000 },
        { upTo: 500000, rate: 5, minIncome: 300000, maxIncome: 500000 },
        { upTo: 1000000, rate: 20, minIncome: 500000, maxIncome: 1000000 },
        { upTo: null, rate: 30, minIncome: 1000000, maxIncome: null },
      ],
      superSenior: [
        { upTo: 500000, rate: 0, minIncome: 0, maxIncome: 500000 },
        { upTo: 1000000, rate: 20, minIncome: 500000, maxIncome: 1000000 },
        { upTo: null, rate: 30, minIncome: 1000000, maxIncome: null },
      ],
    },
    standardDeduction: 50000,
    rebate: {
      incomeLimit: 500000,
      maxRebate: 12500,
    },
    deductionLimits: {
      sec80C: 150000,
      sec80CCD1B: 50000,
      sec80D_selfFamily: {
        normal: 25000,
        senior: 50000,
      },
      sec80D_parents: {
        normal: 25000,
        senior: 50000,
      },
      homeLoanInterestSelfOccupied: 200000,
    },
    hra: {
      metroPercent: 50,
      nonMetroPercent: 40,
      rentMinusBasicPercent: 10,
    },
  },
};

/**
 * Creates mock ComparisonResult matching Phase 2 engine outputs
 */
export function createMockComparisonResult(overrides?: Partial<ComparisonResult>): ComparisonResult {
  return {
    recommended: "new",
    savings: 159900,
    savingsPercent: 62.12,
    breakEven: 487500,
    newRegime: {
      regime: "new",
      grossIncome: 1500000,
      standardDeductionApplied: 75000,
      deductionsApplied: {},
      taxableIncome: 1425000,
      taxBeforeRebate: 93750,
      rebateApplied: 0,
      marginalReliefApplied: 0,
      taxAfterRebate: 93750,
      cess: 3750,
      totalTax: 97500,
      effectiveRatePercent: 6.5,
      monthlyTax: 8125,
      slabBreakdown: [
        { from: 0, upTo: 400000, rate: 0, taxableAmount: 400000, tax: 0 },
        { from: 400000, upTo: 800000, rate: 5, taxableAmount: 400000, tax: 20000 },
        { from: 800000, upTo: 1200000, rate: 10, taxableAmount: 400000, tax: 40000 },
        { from: 1200000, upTo: 1600000, rate: 15, taxableAmount: 225000, tax: 33750 },
      ],
      steps: [
        { stepKey: "GROSS_INCOME", value: 1500000, formattedValue: "₹15,00,000" },
        { stepKey: "STANDARD_DEDUCTION", value: 75000, formattedValue: "₹75,000" },
        { stepKey: "TAXABLE_INCOME", value: 1425000, formattedValue: "₹14,25,000" },
        { stepKey: "SLAB_TAX", value: 93750, formattedValue: "₹93,750" },
        { stepKey: "CESS", value: 3750, formattedValue: "₹3,750" },
        { stepKey: "TOTAL_TAX", value: 97500, formattedValue: "₹97,500" },
      ],
      warnings: [],
    },
    oldRegime: {
      regime: "old",
      grossIncome: 1500000,
      standardDeductionApplied: 50000,
      deductionsApplied: {},
      taxableIncome: 1450000,
      taxBeforeRebate: 247500,
      rebateApplied: 0,
      marginalReliefApplied: 0,
      taxAfterRebate: 247500,
      cess: 9900,
      totalTax: 257400,
      effectiveRatePercent: 17.16,
      monthlyTax: 21450,
      slabBreakdown: [
        { from: 0, upTo: 250000, rate: 0, taxableAmount: 250000, tax: 0 },
        { from: 250000, upTo: 500000, rate: 5, taxableAmount: 250000, tax: 12500 },
        { from: 500000, upTo: 1000000, rate: 20, taxableAmount: 500000, tax: 100000 },
        { from: 1000000, upTo: null, rate: 30, taxableAmount: 450000, tax: 135000 },
      ],
      steps: [
        { stepKey: "GROSS_INCOME", value: 1500000, formattedValue: "₹15,00,000" },
        { stepKey: "STANDARD_DEDUCTION", value: 50000, formattedValue: "₹50,000" },
        { stepKey: "TAXABLE_INCOME", value: 1450000, formattedValue: "₹14,50,000" },
        { stepKey: "SLAB_TAX", value: 247500, formattedValue: "₹2,47,500" },
        { stepKey: "CESS", value: 9900, formattedValue: "₹9,900" },
        { stepKey: "TOTAL_TAX", value: 257400, formattedValue: "₹2,57,400" },
      ],
      warnings: [],
    },
    ...overrides,
  };
}

export function setupFetchMock(customResult?: ComparisonResult) {
  const resultToReturn = customResult || createMockComparisonResult();

  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = url.toString();
    if (urlStr.includes("/rules/")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: MOCK_TAX_RULES }),
      } as Response;
    }

    if (urlStr.includes("/tax/calculate")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: resultToReturn }),
      } as Response;
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({ success: false, error: { message: "Not found" } }),
    } as Response;
  }) as typeof globalThis.fetch;
}
