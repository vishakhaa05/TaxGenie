import { Request, Response, NextFunction } from "express";
import {
  gstCalculateSchema,
  invoicePreviewSchema,
  validateGstinSchema,
} from "../validators/engine.validator";
import { RulesService } from "../services/rules.service";
import { calculateGst } from "../engine/gst/calculate";
import { calculateInvoice } from "../engine/gst/invoice";
import { validateGstin } from "../engine/gst/gstin";
import { amountInWords } from "../engine/gst/amountInWords";
import { GST_STATES } from "../engine/gst/states";
import { GstRulesConfig } from "../engine/gst/types";

export class GstController {
  private static async getGstRules(taxYear: string): Promise<GstRulesConfig> {
    const rules = await RulesService.getRulesForYear(taxYear);
    return rules?.gst || {
      supportedRates: [0, 5, 18, 40],
      defaultRate: 18,
    };
  }

  public static async getGstMetaEndpoint(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const taxYear = typeof req.query.taxYear === "string" ? req.query.taxYear : "2026-27";
      const gstRules = await GstController.getGstRules(taxYear);

      return res.status(200).json({
        success: true,
        data: {
          states: GST_STATES,
          supportedRates: gstRules.supportedRates,
          defaultRate: gstRules.defaultRate,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async calculateGstEndpoint(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsed = gstCalculateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid GST calculation payload",
            details: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const input = parsed.data;
      const gstRules = await GstController.getGstRules(input.taxYear);

      const result = calculateGst(
        {
          amount: input.amount,
          rate: input.rate,
          mode: input.mode,
          sellerState: input.sellerState,
          buyerState: input.buyerState,
        },
        gstRules
      );

      return res.status(200).json({
        success: true,
        data: {
          ...result,
          amountInWords: amountInWords(result.total),
        },
      });
    } catch (error: any) {
      if (error?.code === "UNSUPPORTED_GST_RATE") {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            rate: error.rate,
          },
        });
      }
      next(error);
    }
  }

  public static async invoicePreviewEndpoint(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsed = invoicePreviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid invoice preview payload",
            details: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const input = parsed.data;
      const gstRules = await GstController.getGstRules(input.taxYear);

      const result = calculateInvoice(
        {
          items: input.items,
          sellerState: input.sellerState,
          buyerState: input.buyerState,
          priceIncludesGst: input.priceIncludesGst,
        },
        gstRules
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error?.code === "UNSUPPORTED_GST_RATE") {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            rate: error.rate,
          },
        });
      }
      next(error);
    }
  }

  public static async validateGstinEndpoint(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsed = validateGstinSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid GSTIN payload",
            details: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const result = validateGstin(parsed.data.gstin);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
