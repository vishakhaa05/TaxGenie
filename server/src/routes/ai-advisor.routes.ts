import { Router, Request, Response, NextFunction } from "express";
import { AiAdvisorController } from "../controllers/ai-advisor.controller";
import passport from "passport";

const router = Router();

const optionalJwt = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization) {
    passport.authenticate("jwt", { session: false }, (_err: any, user: any) => {
      if (user) req.user = user;
      next();
    })(req, res, next);
  } else {
    next();
  }
};

router.post("/chat", optionalJwt, AiAdvisorController.askChat);
router.post("/savings-advice", optionalJwt, AiAdvisorController.getSavingsAdvice);
router.get("/anomalies", optionalJwt, AiAdvisorController.getAnomalies);

export default router;
