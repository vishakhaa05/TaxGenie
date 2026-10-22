import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/status", SubscriptionController.getStatus);
router.post("/upgrade", SubscriptionController.upgradePlan);

export default router;
