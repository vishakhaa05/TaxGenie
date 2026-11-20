import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "../validators/auth.validator";
import {
  updateProfileService,
  changePasswordService,
  deleteAccountService,
} from "../services/auth.service";
import { clearAuthCookies } from "../utils/cookies";

export const getCurrentUserController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: {
      user: user && typeof (user as any).omitPassword === "function" ? (user as any).omitPassword() : user,
    },
  });
});

export const updateProfileController = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?._id || req.user?.id || "");
  const body = updateProfileSchema.parse(req.body);

  const updatedUser = await updateProfileService(userId, body);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: {
      ...updatedUser,
      user: updatedUser,
      message: "Profile preferences updated successfully.",
    },
  });
});

export const changePasswordController = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?._id || req.user?.id || "");
  const body = changePasswordSchema.parse(req.body);

  const result = await changePasswordService(userId, body);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: result,
  });
});

export const deleteAccountController = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?._id || req.user?.id || "");
  const body = deleteAccountSchema.parse(req.body);


  const result = await deleteAccountService(userId, body.password);
  clearAuthCookies(res);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: result,
  });
});
