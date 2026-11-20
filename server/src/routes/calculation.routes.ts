import { Router } from "express";
import {
  saveCalculationController,
  listCalculationsController,
  getCalculationByIdController,
  renameCalculationController,
  deleteCalculationController,
  recalculateController,
} from "../controllers/calculation.controller";
import { requireAuth, requireCsrf, sanitizeNoSql } from "../middlewares/security.middleware";

const calculationRoutes = Router();

calculationRoutes.use(sanitizeNoSql);
calculationRoutes.use(requireAuth);

calculationRoutes.post("/", requireCsrf, saveCalculationController);
calculationRoutes.get("/", listCalculationsController);
calculationRoutes.get("/:id", getCalculationByIdController);
calculationRoutes.patch("/:id", requireCsrf, renameCalculationController);
calculationRoutes.delete("/:id", requireCsrf, deleteCalculationController);
calculationRoutes.post("/:id/recalculate", requireCsrf, recalculateController);

export default calculationRoutes;
