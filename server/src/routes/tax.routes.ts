import { Router, Request, Response, NextFunction } from "express";
import { TaxController } from "../controllers/tax.controller";
import passport from "passport";

const router = Router();

// Optional JWT middleware: populate req.user if Authorization header present, but never reject guests
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

// Phase 2 Pure Engine Endpoint (guest accessible)
router.post("/calculate", TaxController.calculateTaxPure);

// Existing endpoints
router.get("/config", TaxController.getSlabConfig);
router.post("/compare", optionalJwt, TaxController.calculateTaxComparison);
router.get("/auto-pull", optionalJwt, TaxController.autoPullDeductions);

export default router;
