import { Request, Response, NextFunction } from "express";
import { TaxService } from "../services/tax.service";
import { RulesService } from "../services/rules.service";
import { taxCalculateSchema } from "../validators/engine.validator";
import { compareRegimes } from "../engine/tax/compare";

export class TaxController {
  public static async getSlabConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const fy = (req.query.financialYear as string) || "2026-2027";
      const config = await TaxService.getOrSeedTaxConfig(fy);
      return res.status(200).json({ success: true, config });
    } catch (error) {
      next(error);
    }
  }

  public static async autoPullDeductions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const fy = (req.query.financialYear as string) || "2026-2027";

      const deductions = await TaxService.autoPullDeductionsFromTransactions(
        userId,
        fy
      );

      return res.status(200).json({ success: true, deductions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Phase 2 Pure Income Tax calculation endpoint: POST /api/tax/calculate
   * Validates TaxInput via Zod, loads active rules for the requested tax year,
   * and runs the pure compareRegimes engine.
   */
  public static async calculateTaxPure(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsed = taxCalculateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid tax calculation input payload",
            details: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const input = parsed.data;
      const rules = await RulesService.getRulesForYear(input.taxYear);

      if (!rules) {
        return res.status(404).json({
          success: false,
          error: {
            code: "TAX_YEAR_NOT_FOUND",
            message: `Tax rules not found for financial year: "${input.taxYear}". Available year: "2026-27"`,
          },
        });
      }

      const comparison = compareRegimes(input, rules);

      return res.status(200).json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Backwards-compatible comparison endpoint
   */
  public static async calculateTaxComparison(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const {
        grossIncome,
        financialYear,
        isSalaried,
        sec80C,
        sec80D,
        hraExemption,
        homeLoanInterest,
        otherDeductions,
      } = req.body;

      const result = await TaxService.calculateTaxComparison({
        userId,
        financialYear,
        grossIncome: Number(grossIncome) || 0,
        isSalaried: isSalaried !== false,
        sec80C: Number(sec80C) || 0,
        sec80D: Number(sec80D) || 0,
        hraExemption: Number(hraExemption) || 0,
        homeLoanInterest: Number(homeLoanInterest) || 0,
        otherDeductions: Number(otherDeductions) || 0,
      });

      return res.status(200).json({ success: true, comparison: result });
    } catch (error) {
      next(error);
    }
  }
}
