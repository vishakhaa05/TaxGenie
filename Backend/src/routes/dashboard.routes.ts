import { Router } from "express";
import { getDashboardSummaryController } from "../controllers/dashboard.controller";
import { optionalAuth, sanitizeNoSql } from "../middlewares/security.middleware";

const dashboardRoutes = Router();

dashboardRoutes.use(sanitizeNoSql);
dashboardRoutes.use(optionalAuth);

dashboardRoutes.get("/summary", getDashboardSummaryController);

export default dashboardRoutes;
