import TaxSlabConfigModel, {
  TaxSlabConfigDocument,
} from "../models/tax-slab-config.model";
import TransactionModel from "../models/transaction.model";
import mongoose from "mongoose";

export interface CalculateTaxInput {
  userId?: string;
  financialYear?: string;
  grossIncome: number;
  isSalaried?: boolean;
  sec80C?: number;
  sec80D?: number;
  hraExemption?: number;
  homeLoanInterest?: number;
  otherDeductions?: number;
}

const STATUTORY_TAX_CONFIGS: Record<string, any> = {
  "2026-2027": {
    financialYear: "2026-2027",
    assessmentYear: "2027-2028",
    newRegime: {
      standardDeduction: 75000,
      rebateMaxIncome: 1200000,
      rebateAmount: 60000,
      slabs: [
        { minIncome: 0, maxIncome: 400000, rate: 0 },
        { minIncome: 400000, maxIncome: 800000, rate: 5 },
        { minIncome: 800000, maxIncome: 1200000, rate: 10 },
        { minIncome: 1200000, maxIncome: 1600000, rate: 15 },
        { minIncome: 1600000, maxIncome: 2000000, rate: 20 },
        { minIncome: 2000000, maxIncome: 2400000, rate: 25 },
        { minIncome: 2400000, maxIncome: null, rate: 30 },
      ],
    },
    oldRegime: {
      standardDeduction: 50000,
      max80C: 150000,
      slabs: [
        { minIncome: 0, maxIncome: 250000, rate: 0 },
        { minIncome: 250000, maxIncome: 500000, rate: 5 },
        { minIncome: 500000, maxIncome: 1000000, rate: 20 },
        { minIncome: 1000000, maxIncome: null, rate: 30 },
      ],
    },
  },
  "2025-2026": {
    financialYear: "2025-2026",
    assessmentYear: "2026-2027",
    newRegime: {
      standardDeduction: 75000,
      rebateMaxIncome: 700000,
      rebateAmount: 25000,
      slabs: [
        { minIncome: 0, maxIncome: 300000, rate: 0 },
        { minIncome: 300000, maxIncome: 700000, rate: 5 },
        { minIncome: 700000, maxIncome: 1000000, rate: 10 },
        { minIncome: 1000000, maxIncome: 1200000, rate: 15 },
        { minIncome: 1200000, maxIncome: 1500000, rate: 20 },
        { minIncome: 1500000, maxIncome: null, rate: 30 },
      ],
    },
    oldRegime: {
      standardDeduction: 50000,
      max80C: 150000,
      slabs: [
        { minIncome: 0, maxIncome: 250000, rate: 0 },
        { minIncome: 250000, maxIncome: 500000, rate: 5 },
        { minIncome: 500000, maxIncome: 1000000, rate: 20 },
        { minIncome: 1000000, maxIncome: null, rate: 30 },
      ],
    },
  },
};

export class TaxService {
  public static async getOrSeedTaxConfig(financialYear = "2026-2027") {
    const fallbackConfig =
      STATUTORY_TAX_CONFIGS[financialYear] || STATUTORY_TAX_CONFIGS["2026-2027"];

    if (mongoose.connection.readyState === 1) {
      try {
        let config = await TaxSlabConfigModel.findOne({ financialYear });

        if (!config) {
          config = await TaxSlabConfigModel.create(fallbackConfig);
        }

        return config;
      } catch (err) {
        console.warn("MongoDB TaxSlabConfig query failed, using statutory config:", err);
      }
    }

    return fallbackConfig;
  }

  public static async autoPullDeductionsFromTransactions(
    userId?: string,
    financialYear = "2026-2027"
  ) {
    if (!userId || mongoose.connection.readyState !== 1) {
      return {
        sec80C: 0,
        sec80D: 0,
        hraExemption: 0,
        homeLoanInterest: 0,
        otherDeductions: 0,
        totalPulledCount: 0,
      };
    }

    try {
      const parts = financialYear.split("-").map(Number);
      const startYear = parts[0] || 2026;
      const startDate = new Date(startYear, 3, 1); // April 1
      const endDate = new Date(startYear + 1, 2, 31, 23, 59, 59); // March 31

      const deductibleTxns = await TransactionModel.find({
        userId,
        isTaxDeductible: true,
        date: { $gte: startDate, $lte: endDate },
      });

      let sec80C = 0;
      let sec80D = 0;
      let hraExemption = 0;
      let homeLoanInterest = 0;
      let otherDeductions = 0;

      deductibleTxns.forEach((txn) => {
        const amt = Number(txn.amount) || 0;
        const section = (txn.deductionSection as string) || "";
        switch (section) {
          case "80C":
          case "SEC_80C":
            sec80C += amt;
            break;
          case "80D":
          case "SEC_80D":
            sec80D += amt;
            break;
          case "HRA":
            hraExemption += amt;
            break;
          case "HOME_LOAN":
            homeLoanInterest += amt;
            break;
          default:
            otherDeductions += amt;
            break;
        }
      });

      return {
        sec80C: Math.min(sec80C, 150000), // capped at 1.5L
        sec80D: Math.min(sec80D, 25000),
        hraExemption,
        homeLoanInterest,
        otherDeductions,
        totalPulledCount: deductibleTxns.length,
      };
    } catch (err) {
      console.warn("Could not query transactions for deductions:", err);
      return {
        sec80C: 0,
        sec80D: 0,
        hraExemption: 0,
        homeLoanInterest: 0,
        otherDeductions: 0,
        totalPulledCount: 0,
      };
    }
  }

  public static async calculateTaxComparison(input: CalculateTaxInput) {
    const config = await this.getOrSeedTaxConfig(
      input.financialYear || "2026-2027"
    );

    const grossIncome = Math.max(0, input.grossIncome);
    const isSalaried = input.isSalaried !== false; // default true

    // 1. New Regime Calculation
    const newStdDeduction = isSalaried ? config.newRegime.standardDeduction : 0;
    const newTaxableIncome = Math.max(0, grossIncome - newStdDeduction);

    let newTaxBeforeRebate = 0;
    for (const slab of config.newRegime.slabs) {
      if (newTaxableIncome > slab.minIncome) {
        const taxableAmountInSlab = slab.maxIncome
          ? Math.min(newTaxableIncome, slab.maxIncome) - slab.minIncome
          : newTaxableIncome - slab.minIncome;
        newTaxBeforeRebate += (taxableAmountInSlab * slab.rate) / 100;
      }
    }

    let newRebate = 0;
    let newTaxAfterRelief = newTaxBeforeRebate;

    if (newTaxableIncome <= config.newRegime.rebateMaxIncome) {
      newRebate = Math.min(newTaxBeforeRebate, config.newRegime.rebateAmount);
      newTaxAfterRelief = Math.max(0, newTaxBeforeRebate - newRebate);
    } else {
      // Marginal Relief: Tax payable cannot exceed excess income over threshold
      const excessIncome = newTaxableIncome - config.newRegime.rebateMaxIncome;
      if (newTaxBeforeRebate > excessIncome) {
        newRebate = newTaxBeforeRebate - excessIncome;
        newTaxAfterRelief = excessIncome;
      }
    }

    const newCess = Math.round(newTaxAfterRelief * 0.04);
    const newTotalTax = Math.round(newTaxAfterRelief + newCess);

    // 2. Old Regime Calculation
    const oldStdDeduction = isSalaried ? config.oldRegime.standardDeduction : 0;
    const sec80C = Math.min(input.sec80C || 0, config.oldRegime.max80C);
    const sec80D = Math.min(input.sec80D || 0, 25000);
    const hra = Math.max(0, input.hraExemption || 0);
    const homeLoan = Math.min(200000, Math.max(0, input.homeLoanInterest || 0));
    const other = Math.max(0, input.otherDeductions || 0);

    const totalOldDeductions =
      oldStdDeduction + sec80C + sec80D + hra + homeLoan + other;

    const oldTaxableIncome = Math.max(0, grossIncome - totalOldDeductions);

    let oldTaxBeforeRebate = 0;
    for (const slab of config.oldRegime.slabs) {
      if (oldTaxableIncome > slab.minIncome) {
        const taxableAmountInSlab = slab.maxIncome
          ? Math.min(oldTaxableIncome, slab.maxIncome) - slab.minIncome
          : oldTaxableIncome - slab.minIncome;
        oldTaxBeforeRebate += (taxableAmountInSlab * slab.rate) / 100;
      }
    }

    let oldRebate = 0;
    let oldTaxAfterRelief = oldTaxBeforeRebate;

    if (oldTaxableIncome <= 500000) {
      oldRebate = Math.min(oldTaxBeforeRebate, 12500);
      oldTaxAfterRelief = Math.max(0, oldTaxBeforeRebate - oldRebate);
    } else {
      const excessIncome = oldTaxableIncome - 500000;
      if (oldTaxBeforeRebate > excessIncome) {
        oldRebate = oldTaxBeforeRebate - excessIncome;
        oldTaxAfterRelief = excessIncome;
      }
    }

    const oldCess = Math.round(oldTaxAfterRelief * 0.04);
    const oldTotalTax = Math.round(oldTaxAfterRelief + oldCess);

    // Recommendation
    const recommendedRegime =
      newTotalTax <= oldTotalTax ? "NEW_REGIME" : "OLD_REGIME";
    const taxSavings = Math.abs(oldTotalTax - newTotalTax);

    return {
      financialYear: config.financialYear,
      assessmentYear: config.assessmentYear,
      grossIncome,
      newRegime: {
        standardDeduction: newStdDeduction,
        taxableIncome: newTaxableIncome,
        taxBeforeRebate: newTaxBeforeRebate,
        rebate87A: newRebate,
        cess: newCess,
        totalTaxLiability: newTotalTax,
      },
      oldRegime: {
        standardDeduction: oldStdDeduction,
        deductions80C: sec80C,
        deductions80D: sec80D,
        hraExemption: hra,
        homeLoanInterest: homeLoan,
        otherDeductions: other,
        totalDeductions: totalOldDeductions,
        taxableIncome: oldTaxableIncome,
        taxBeforeRebate: oldTaxBeforeRebate,
        rebate87A: oldRebate,
        cess: oldCess,
        totalTaxLiability: oldTotalTax,
      },
      recommendedRegime,
      taxSavings,
      summary:
        recommendedRegime === "NEW_REGIME"
          ? `New Tax Regime saves you ₹${taxSavings.toLocaleString(
              "en-IN"
            )} in taxes due to lower slab rates and Section 87A rebate!`
          : `Old Tax Regime saves you ₹${taxSavings.toLocaleString(
              "en-IN"
            )} in taxes due to your Section 80C/80D/HRA deductions!`,
    };
  }
}
