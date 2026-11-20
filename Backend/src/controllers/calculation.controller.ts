import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  saveCalculationSchema,
  renameCalculationSchema,
  listCalculationsQuerySchema,
} from "../validators/calculation.validator";
import {
  saveCalculationService,
  listCalculationsService,
  getCalculationByIdService,
  renameCalculationService,
  deleteCalculationService,
  recalculateService,
} from "../services/calculation.service";

export const saveCalculationController = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?._id || req.user?.id || "");
  const body = saveCalculationSchema.parse(req.body);

  const calculation = await saveCalculationService(userId, body);

  return res.status(HTTPSTATUS.CREATED).json({
    success: true,
    data: calculation,
  });
});

export const listCalculationsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?._id || req.user?.id || "");
  const query = listCalculationsQuerySchema.parse(req.query);

  const result = await listCalculationsService(userId, query);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: result,
  });
});

export const getCalculationByIdController = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?._id || req.user?.id || "");
  const id = String(req.params.id);

  const calculation = await getCalculationByIdService(id, userId);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: calculation,
  });
});

export const renameCalculationController = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?._id || req.user?.id || "");
  const id = String(req.params.id);
  const body = renameCalculationSchema.parse(req.body);

  const updated = await renameCalculationService(id, userId, body.name);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: updated,
  });
});

export const deleteCalculationController = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?._id || req.user?.id || "");
  const id = String(req.params.id);

  const result = await deleteCalculationService(id, userId);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: result,
  });
});

export const recalculateController = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?._id || req.user?.id || "");
  const id = String(req.params.id);

  const result = await recalculateService(id, userId);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: result,
  });
});

