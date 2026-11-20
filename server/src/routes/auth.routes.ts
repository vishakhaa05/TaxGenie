import { Router } from "express";
import {
  registerController,
  verifyOtpController,
  resendOtpController,
  loginController,
  refreshTokenController,
  logoutController,
  logoutAllController,
  forgotPasswordController,
  resetPasswordController,
  getMeController,
} from "../controllers/auth.controller";
import { requireAuth, requireCsrf, sanitizeNoSql } from "../middlewares/security.middleware";
import rateLimit from "express-rate-limit";

const authRoutes = Router();

// Strict rate limiters for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30, // 30 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many authentication requests. Please try again after 15 minutes.",
    },
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many OTP requests. Please wait before trying again.",
    },
  },
});

authRoutes.use(sanitizeNoSql);

authRoutes.post("/register", authLimiter, requireCsrf, registerController);
authRoutes.post("/verify-otp", otpLimiter, requireCsrf, verifyOtpController);
authRoutes.post("/resend-otp", otpLimiter, requireCsrf, resendOtpController);
authRoutes.post("/login", authLimiter, requireCsrf, loginController);
authRoutes.post("/refresh", requireCsrf, refreshTokenController);
authRoutes.post("/refresh-token", requireCsrf, refreshTokenController); // alias for backwards compatibility
authRoutes.post("/logout", requireCsrf, logoutController);
authRoutes.post("/logout-all", requireAuth, requireCsrf, logoutAllController);
authRoutes.post("/forgot-password", authLimiter, requireCsrf, forgotPasswordController);
authRoutes.post("/reset-password", authLimiter, requireCsrf, resetPasswordController);
authRoutes.get("/me", requireAuth, getMeController);

export default authRoutes;
