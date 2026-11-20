import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";
import {
  registerService,
  verifyOtpService,
  resendOtpService,
  loginService,
  refreshTokenService,
  logoutService,
  logoutAllService,
  forgotPasswordService,
  resetPasswordService,
} from "../services/auth.service";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies";

export const registerController = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const result = await registerService(body);
  return res.status(HTTPSTATUS.CREATED).json({
    success: true,
    data: result,
  });
});

export const verifyOtpController = asyncHandler(async (req: Request, res: Response) => {
  const body = verifyOtpSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await verifyOtpService(body);

  setAuthCookies(res, accessToken, refreshToken);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

export const resendOtpController = asyncHandler(async (req: Request, res: Response) => {
  const body = resendOtpSchema.parse(req.body);
  const result = await resendOtpService(body);
  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: result,
  });
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const metadata = {
    userAgent: req.headers["user-agent"] || "",
    ip: req.ip || req.socket.remoteAddress || "",
  };

  const { user, accessToken, refreshToken } = await loginService(body, metadata);

  setAuthCookies(res, accessToken, refreshToken);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

export const refreshTokenController = asyncHandler(async (req: Request, res: Response) => {
  const token =
    req.cookies?.refreshToken || req.cookies?.refresh_token || req.body?.refreshToken;
  const metadata = {
    userAgent: req.headers["user-agent"] || "",
    ip: req.ip || req.socket.remoteAddress || "",
  };

  const { accessToken, refreshToken, user } = await refreshTokenService(token, metadata);


  setAuthCookies(res, accessToken, refreshToken);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  const token =
    req.cookies?.refreshToken || req.cookies?.refresh_token || req.body?.refreshToken;
  await logoutService(token);

  clearAuthCookies(res);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: { message: "Logged out successfully." },
  });
});

export const logoutAllController = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?._id || req.user?.id) {
    await logoutAllService(String(req.user._id || req.user.id));
  }
  clearAuthCookies(res);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: { message: "All sessions have been revoked." },
  });
});

export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const body = forgotPasswordSchema.parse(req.body);
  const result = await forgotPasswordService(body);
  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: result,
  });
});

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const body = resetPasswordSchema.parse(req.body);
  const result = await resetPasswordService(body);
  clearAuthCookies(res);

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: result,
  });
});

export const getMeController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  return res.status(HTTPSTATUS.OK).json({
    success: true,
    data: {
      user: user && typeof (user as any).omitPassword === "function" ? (user as any).omitPassword() : user,
    },
  });

});
