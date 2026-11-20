import { Router } from "express";
import { requireAuth, requireCsrf } from "../middlewares/security.middleware";
import { BusinessProfileController } from "../controllers/business-profile.controller";

const router = Router();

router.get("/", requireAuth, BusinessProfileController.getProfile);
router.put("/", requireAuth, requireCsrf, BusinessProfileController.saveProfile);

export default router;
