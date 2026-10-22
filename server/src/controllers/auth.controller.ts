import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import {
  loginService,
  registerService,
  refreshTokenService,
} from "../services/auth.service";

export const registerController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse(req.body);

    const result = await registerService(body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User registered successfully",
      data: result,
    });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = loginSchema.parse({
      ...req.body,
    });
    const { user, accessToken, refreshToken, expiresAt, reportSetting } =
      await loginService(body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User logged in successfully",
      user,
      accessToken,
      refreshToken,
      expiresAt,
      reportSetting,
    });
  }
);

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const tokenFromHeader = req.headers.authorization?.replace(/^Bearer\s+/, "");
    const tokenFromBody = req.body?.refreshToken;
    const tokenFromCookie = req.cookies?.refreshToken;
    const token = tokenFromBody || tokenFromCookie || tokenFromHeader;

    const result = await refreshTokenService(token, req.user?._id?.toString());

    return res.status(HTTPSTATUS.OK).json({
      message: "Token refreshed successfully",
      ...result,
    });
  }
);

export const logoutController = asyncHandler(
  async (req: Request, res: Response) => {
    return res.status(HTTPSTATUS.OK).json({
      message: "User logged out successfully",
      success: true,
    });
  }
);
