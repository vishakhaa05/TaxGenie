import { Router } from "express";
import { RulesController } from "../controllers/rules.controller";

const router = Router();

// Phase 2 Rules API: GET /api/rules/:taxYear (accessible without login)
router.get("/:taxYear", RulesController.getRulesByYear);

export default router;
