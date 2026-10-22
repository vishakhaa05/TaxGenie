import { describe, it, expect } from "vitest";
import seedRulesRaw from "../../seed/taxRulesFY2026_27.json";
import { TaxYearRules, TaxInput } from "../tax/types";
import { calculateNewRegime } from "../tax/newRegime";
import { calculateOldRegime } from "../tax/oldRegime";
import { calculateHraExemption } from "../tax/hra";
import { compareRegimes } from "../tax/compare";
import { findBreakEvenDeductions } from "../tax/breakEven";
import { EngineValidationError } from "../shared/errors";

const seedRules = seedRulesRaw as unknown as TaxYearRules;

describe("Income Tax Engine - FY 2026-27 Statutory Specifications", () => {
  describe("New Tax Regime (Section 115BAC)", () => {
    it("Salary 0 -> tax 0", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 0,
        otherIncome: 0,
        taxYear: "2026-27",
      };
      const res = calculateNewRegime(input, seedRules);
      expect(res.taxableIncome).toBe(0);
      expect(res.totalTax).toBe(0);
    });

    it("Salary 3,00,000 -> taxable 2,25,000 -> tax 0", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 300000,
        taxYear: "2026-27",
      };
      const res = calculateNewRegime(input, seedRules);
      expect(res.standardDeductionApplied).toBe(75000);
      expect(res.taxableIncome).toBe(225000);
      expect(res.totalTax).toBe(0);
    });

    it("Salary 10,00,000 -> taxable 9,25,000 -> tax before rebate 32,500 -> rebate -> final 0", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 1000000,
        taxYear: "2026-27",
      };
      const res = calculateNewRegime(input, seedRules);
      expect(res.taxableIncome).toBe(925000);
      expect(res.taxBeforeRebate).toBe(32500);
      expect(res.rebateApplied).toBe(32500);
      expect(res.taxAfterRebate).toBe(0);
      expect(res.totalTax).toBe(0);
    });

    it("Salary 12,75,000 -> taxable 12,00,000 -> tax before rebate 60,000 -> rebate -> final 0", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 1275000,
        taxYear: "2026-27",
      };
      const res = calculateNewRegime(input, seedRules);
      expect(res.taxableIncome).toBe(1200000);
      expect(res.taxBeforeRebate).toBe(60000);
      expect(res.rebateApplied).toBe(60000);
      expect(res.taxAfterRebate).toBe(0);
      expect(res.totalTax).toBe(0);
    });

    it("Salary 13,00,000 -> taxable 12,25,000 -> slab tax 63,750 -> marginal relief limits it to 25,000 -> cess 1,000 -> final 26,000", () => {
      // TODO: confirm against official income tax calculator
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 1300000,
        taxYear: "2026-27",
      };
      const res = calculateNewRegime(input, seedRules);
      expect(res.taxableIncome).toBe(1225000);
      expect(res.taxBeforeRebate).toBe(63750);
      expect(res.marginalReliefApplied).toBe(38750); // 63750 - 25000
      expect(res.taxAfterRebate).toBe(25000);
      expect(res.cess).toBe(1000);
      expect(res.totalTax).toBe(26000);
      expect(res.warnings.some((w) => w.code === "MARGINAL_RELIEF_APPLIED")).toBe(true);
    });

    it("Salary 15,00,000 -> taxable 14,25,000 -> tax 93,750 + cess 3,750 = 97,500", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 1500000,
        taxYear: "2026-27",
      };
      const res = calculateNewRegime(input, seedRules);
      expect(res.taxableIncome).toBe(1425000);
      expect(res.taxBeforeRebate).toBe(93750);
      expect(res.marginalReliefApplied).toBe(0);
      expect(res.taxAfterRebate).toBe(93750);
      expect(res.cess).toBe(3750);
      expect(res.totalTax).toBe(97500);
    });

    it("Salary 24,00,000 -> taxable 23,25,000 -> tax 2,81,250 + cess 11,250 = 2,92,500", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 2400000,
        taxYear: "2026-27",
      };
      const res = calculateNewRegime(input, seedRules);
      expect(res.taxableIncome).toBe(2325000);
      expect(res.taxBeforeRebate).toBe(281250);
      expect(res.cess).toBe(11250);
      expect(res.totalTax).toBe(292500);
    });

    it("guards against negative or invalid salary input", () => {
      expect(() =>
        calculateNewRegime(
          { ageGroup: "below60", salaryIncome: -5000, taxYear: "2026-27" },
          seedRules
        )
      ).toThrow(EngineValidationError);
    });
  });

  describe("Old Tax Regime", () => {
    it("Salary 15,00,000, no deductions -> taxable 14,50,000 -> tax 2,47,500 + cess 9,900 = 2,57,400", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 1500000,
        taxYear: "2026-27",
      };
      const res = calculateOldRegime(input, seedRules);
      expect(res.standardDeductionApplied).toBe(50000);
      expect(res.taxableIncome).toBe(1450000);
      expect(res.taxBeforeRebate).toBe(247500);
      expect(res.cess).toBe(9900);
      expect(res.totalTax).toBe(257400);
    });

    it("Salary 15,00,000, 80C 1,50,000 + NPS 50,000 + 80D 25,000 -> deductions 2,25,000 -> taxable 12,25,000 -> tax 1,80,000 + cess 7,200 = 1,87,200", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 1500000,
        deductions: {
          sec80C: 150000,
          sec80CCD1B: 50000,
          sec80D_selfFamily: 25000,
        },
        taxYear: "2026-27",
      };
      const res = calculateOldRegime(input, seedRules);
      expect(res.taxableIncome).toBe(1225000);
      expect(res.taxBeforeRebate).toBe(180000);
      expect(res.cess).toBe(7200);
      expect(res.totalTax).toBe(187200);
    });

    it("Salary 5,50,000, no deductions -> taxable 5,00,000 -> tax 12,500 -> rebate -> final 0", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 550000,
        taxYear: "2026-27",
      };
      const res = calculateOldRegime(input, seedRules);
      expect(res.taxableIncome).toBe(500000);
      expect(res.taxBeforeRebate).toBe(12500);
      expect(res.rebateApplied).toBe(12500);
      expect(res.totalTax).toBe(0);
    });

    it("Salary 5,60,000, no deductions -> taxable 5,10,000 -> tax 14,500 -> no rebate -> cess 580 -> final 15,080", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 560000,
        taxYear: "2026-27",
      };
      const res = calculateOldRegime(input, seedRules);
      expect(res.taxableIncome).toBe(510000);
      expect(res.taxBeforeRebate).toBe(14500);
      expect(res.rebateApplied).toBe(0);
      expect(res.cess).toBe(580);
      expect(res.totalTax).toBe(15080);
    });

    it("80C entered as 2,00,000 -> only 1,50,000 applied, DEDUCTION_CAPPED warning returned", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 1000000,
        deductions: {
          sec80C: 200000,
        },
        taxYear: "2026-27",
      };
      const res = calculateOldRegime(input, seedRules);
      expect(res.deductionsApplied.sec80C).toBe(150000);
      const cappedWarning = res.warnings.find((w) => w.code === "DEDUCTION_CAPPED");
      expect(cappedWarning).toBeDefined();
      expect(cappedWarning?.params?.allowed).toBe(150000);
      expect(cappedWarning?.params?.entered).toBe(200000);
    });

    it("Senior (65), salary 8,00,000, no deductions -> taxable 7,50,000 -> tax 60,000 + cess 2,400 = 62,400", () => {
      // TODO: verify senior slabs on incometax.gov.in
      const input: TaxInput = {
        ageGroup: "senior",
        salaryIncome: 800000,
        taxYear: "2026-27",
      };
      const res = calculateOldRegime(input, seedRules);
      expect(res.taxableIncome).toBe(750000);
      expect(res.taxBeforeRebate).toBe(60000);
      expect(res.cess).toBe(2400);
      expect(res.totalTax).toBe(62400);
    });
  });

  describe("HRA Exemption Calculator", () => {
    it("Basic 6,00,000, HRA received 2,40,000, rent paid 2,16,000, metro -> exemption 1,56,000", () => {
      const exemption = calculateHraExemption(
        {
          basicSalary: 600000,
          hraReceived: 240000,
          rentPaid: 216000,
          isMetro: true,
        },
        seedRules
      );
      expect(exemption).toBe(156000);
    });

    it("Basic 6,00,000, HRA received 2,40,000, rent paid 1,20,000, metro -> exemption 60,000", () => {
      const exemption = calculateHraExemption(
        {
          basicSalary: 600000,
          hraReceived: 240000,
          rentPaid: 120000,
          isMetro: true,
        },
        seedRules
      );
      expect(exemption).toBe(60000);
    });

    it("Rent paid less than 10% of basic -> exemption 0 (never negative)", () => {
      const exemption = calculateHraExemption(
        {
          basicSalary: 600000,
          hraReceived: 240000,
          rentPaid: 40000, // less than 60,000 (10% of basic)
          isMetro: true,
        },
        seedRules
      );
      expect(exemption).toBe(0);
    });
  });

  describe("Regime Comparison & Break-Even Deductions", () => {
    it("Salary 15,00,000, no deductions -> recommended 'new', savings 1,59,900 (2,57,400 minus 97,500)", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 1500000,
        taxYear: "2026-27",
      };
      const comp = compareRegimes(input, seedRules);
      expect(comp.recommended).toBe("new");
      expect(comp.oldRegime.totalTax).toBe(257400);
      expect(comp.newRegime.totalTax).toBe(97500);
      expect(comp.savings).toBe(159900);
      expect(comp.breakEven).not.toBeNull();
    });

    it("Break-even: applying the returned break-even amount makes old regime <= new regime; one rupee less does not", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 1500000,
        taxYear: "2026-27",
      };
      const breakEven = findBreakEvenDeductions(input, seedRules);
      expect(breakEven).not.toBeNull();
      expect(breakEven).toBeGreaterThan(0);

      // Verify that applying breakEven deduction satisfies old <= new
      const targetTax = calculateNewRegime(input, seedRules).totalTax;

      const testInputAtBreakEven: TaxInput = {
        ...input,
        deductions: { sec80C: breakEven! },
      };
      const customRules: TaxYearRules = {
        ...seedRules,
        oldRegime: {
          ...seedRules.oldRegime,
          deductionLimits: {
            ...seedRules.oldRegime.deductionLimits,
            sec80C: breakEven!,
          },
        },
      };

      const oldTaxAtBreakEven = calculateOldRegime(
        testInputAtBreakEven,
        customRules
      ).totalTax;
      expect(oldTaxAtBreakEven).toBeLessThanOrEqual(targetTax);

      // Verify that one rupee less fails (old tax > targetTax)
      const testInputOneRupeeLess: TaxInput = {
        ...input,
        deductions: { sec80C: breakEven! - 1 },
      };
      const customRulesOneRupeeLess: TaxYearRules = {
        ...seedRules,
        oldRegime: {
          ...seedRules.oldRegime,
          deductionLimits: {
            ...seedRules.oldRegime.deductionLimits,
            sec80C: breakEven! - 1,
          },
        },
      };

      const oldTaxOneRupeeLess = calculateOldRegime(
        testInputOneRupeeLess,
        customRulesOneRupeeLess
      ).totalTax;
      expect(oldTaxOneRupeeLess).toBeGreaterThan(targetTax);
    });

    it("Purity: Same inputs always produce identical output", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 1200000,
        otherIncome: 50000,
        taxYear: "2026-27",
      };
      const res1 = compareRegimes(input, seedRules);
      const res2 = compareRegimes(input, seedRules);
      expect(res1).toEqual(res2);
    });
  });

  describe("Property & Surcharge Tests", () => {
    it("Tax is never negative and never exceeds gross income", () => {
      const testSalaries = [0, 50000, 300000, 700000, 1200000, 1500000, 5000000];
      for (const salary of testSalaries) {
        const input: TaxInput = {
          ageGroup: "below60",
          salaryIncome: salary,
          taxYear: "2026-27",
        };
        const nRes = calculateNewRegime(input, seedRules);
        const oRes = calculateOldRegime(input, seedRules);

        expect(nRes.totalTax).toBeGreaterThanOrEqual(0);
        expect(nRes.totalTax).toBeLessThanOrEqual(salary);

        expect(oRes.totalTax).toBeGreaterThanOrEqual(0);
        expect(oRes.totalTax).toBeLessThanOrEqual(salary);
      }
    });

    it("New regime total tax is non-decreasing as income rises", () => {
      let prevTax = 0;
      for (let salary = 0; salary <= 3000000; salary += 100000) {
        const input: TaxInput = {
          ageGroup: "below60",
          salaryIncome: salary,
          taxYear: "2026-27",
        };
        const res = calculateNewRegime(input, seedRules);
        expect(res.totalTax).toBeGreaterThanOrEqual(prevTax);
        prevTax = res.totalTax;
      }
    });

    it("roundingToNearestTen ON gives multiples of 10", () => {
      const rulesWithRounding: TaxYearRules = {
        ...seedRules,
        roundingToNearestTen: true,
      };
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 563421,
        taxYear: "2026-27",
      };
      const nRes = calculateNewRegime(input, rulesWithRounding);
      const oRes = calculateOldRegime(input, rulesWithRounding);

      expect(nRes.taxableIncome % 10).toBe(0);
      expect(nRes.totalTax % 10).toBe(0);
      expect(oRes.taxableIncome % 10).toBe(0);
      expect(oRes.totalTax % 10).toBe(0);
    });

    it("taxable income above 50 lakh returns SURCHARGE_NOT_INCLUDED warning", () => {
      const input: TaxInput = {
        ageGroup: "below60",
        salaryIncome: 6000000,
        taxYear: "2026-27",
      };
      const nRes = calculateNewRegime(input, seedRules);
      const oRes = calculateOldRegime(input, seedRules);

      expect(nRes.warnings.some((w) => w.code === "SURCHARGE_NOT_INCLUDED")).toBe(true);
      expect(oRes.warnings.some((w) => w.code === "SURCHARGE_NOT_INCLUDED")).toBe(true);
    });
  });
});
