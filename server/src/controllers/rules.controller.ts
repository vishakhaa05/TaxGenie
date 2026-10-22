import { Request, Response, NextFunction } from "express";
import { RulesService } from "../services/rules.service";

export class RulesController {
  public static async getRulesByYear(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const taxYear = typeof req.params.taxYear === "string" ? req.params.taxYear : "";
      const rules = await RulesService.getRulesForYear(taxYear);

      if (!rules) {
        return res.status(404).json({
          success: false,
          error: {
            code: "TAX_YEAR_NOT_FOUND",
            message: `Tax rules not found for financial year: "${taxYear}". Available year: "2026-27"`,
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: rules,
      });
    } catch (error) {
      next(error);
    }
  }
}
