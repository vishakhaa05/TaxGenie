import "dotenv/config";
import "./src/config/passport.config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import passport from "passport";
import { Env } from "./src/config/env.config";
import { HTTPSTATUS } from "./src/config/http.config";
import { errorHandler } from "./src/middlewares/errorHandler.middleware";
import { BadRequestException } from "./src/utils/app-error";
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


const app = express();
const BASE_PATH = Env.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use(
  cors({
    origin: Env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException("This is a test error");
    res.status(HTTPSTATUS.OK).json({
      message: "Hello Subcribe to the channel",
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, passportAuthenticateJwt, userRoutes);
app.use(`${BASE_PATH}/transaction`, passportAuthenticateJwt, transactionRoutes);
app.use(`${BASE_PATH}/report`, passportAuthenticateJwt, reportRoutes);
app.use(`${BASE_PATH}/analytics`, passportAuthenticateJwt, analyticsRoutes);

app.use(errorHandler);

const date = getDateRange("lastMonth");
console.log(date);

app.listen(Env.PORT, async () => {
  await connctDatabase();

  if (Env.NODE_ENV === "development") {
    await initializeCrons();
  }

  console.log(`Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
});
