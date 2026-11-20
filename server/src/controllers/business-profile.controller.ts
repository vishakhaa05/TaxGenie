import { Request, Response, NextFunction } from "express";
import { businessProfileSchema, sanitizePayloadKeys } from "../validators/invoice.validator";
import { BusinessProfileService } from "../services/business-profile.service";

export class BusinessProfileController {
  public static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const profile = await BusinessProfileService.getProfile(userId);

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async saveProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!sanitizePayloadKeys(req.body)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PAYLOAD",
            message: "Payload contains forbidden keys",
          },
        });
      }

      const parsed = businessProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid business profile data",
            details: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const saved = await BusinessProfileService.saveProfile(userId, parsed.data);

      return res.status(200).json({
        success: true,
        data: saved,
      });
    } catch (error) {
      next(error);
    }
  }
}
