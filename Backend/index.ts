import "dotenv/config";
import "./src/config/passport.config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { Env } from "./src/config/env.config";
import { HTTPSTATUS } from "./src/config/http.config";
import { errorHandler } from "./src/middlewares/errorHandler.middleware";
import { asyncHandler } from "./src/middlewares/asyncHandler.middleware";
import connctDatabase from "./src/config/database.config";
import authRoutes from "./src/routes/auth.routes";
import { passportAuthenticateJwt } from "./src/config/passport.config";
import userRoutes from "./src/routes/user.routes";
import transactionRoutes from "./src/routes/transaction.routes";
import { initializeCrons } from "./src/cron/index";
import reportRoutes from "./src/routes/report.routes";
import { getDateRange } from "./src/utils/date";
import analyticsRoutes from "./src/routes/analytics.routes";
import taxRoutes from "./src/routes/tax.routes";
import gstRoutes from "./src/routes/gst.routes";
import rulesRoutes from "./src/routes/rules.routes";
import aiAdvisorRoutes from "./src/routes/ai-advisor.routes";
import subscriptionRoutes from "./src/routes/subscription.routes";

export const app = express();
const BASE_PATH = Env.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === Env.FRONTEND_ORIGIN ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Public rate limiter for thin pure engine calculation and rules endpoints
const publicEngineLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many calculation requests. Please try again after 15 minutes.",
    },
  },
});

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(HTTPSTATUS.OK).json({
      success: true,
      service: "TaxGenie API Engine",
      version: "2.0.0",
      status: "operational",
    });
  })
);

// Phase 2 Thin Calculation Engine & Rules Routes (all work without login)
app.use(`${BASE_PATH}/rules`, publicEngineLimiter, rulesRoutes);
app.use(`${BASE_PATH}/tax`, publicEngineLimiter, taxRoutes);
app.use(`${BASE_PATH}/gst`, publicEngineLimiter, gstRoutes);

// Auth & Protected Feature Routes
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, passportAuthenticateJwt, userRoutes);
app.use(`${BASE_PATH}/transaction`, passportAuthenticateJwt, transactionRoutes);
app.use(`${BASE_PATH}/report`, passportAuthenticateJwt, reportRoutes);
app.use(`${BASE_PATH}/analytics`, passportAuthenticateJwt, analyticsRoutes);
app.use(`${BASE_PATH}/ai-advisor`, aiAdvisorRoutes);
app.use(`${BASE_PATH}/subscription`, passportAuthenticateJwt, subscriptionRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  const date = getDateRange("lastMonth");
  console.log("Current date range initialized:", date);

  app.listen(Env.PORT, async () => {
    await connctDatabase();

    if (Env.NODE_ENV === "development") {
      await initializeCrons();
    }

    console.log(`Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
  });
}

export default app;
