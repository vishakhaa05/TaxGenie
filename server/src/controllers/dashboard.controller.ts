import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { getDashboardSummaryService } from "../services/dashboard.service";

export const getDashboardSummaryController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id ? String(req.user._id) : req.user?.id ? String(req.user.id) : null;
  const taxYear = (req.query.taxYear as string) || "2026-27";

  const summary = await getDashboardSummaryService(userId, taxYear);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: summary,
  });
});
