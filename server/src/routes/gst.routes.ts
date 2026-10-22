import { Router } from "express";
import { GstController } from "../controllers/gst.controller";

const router = Router();

// Phase 2 Pure GST Engine Endpoints (all work without login)
router.post("/calculate", GstController.calculateGstEndpoint);
router.post("/invoice-preview", GstController.invoicePreviewEndpoint);
router.post("/validate-gstin", GstController.validateGstinEndpoint);

export default router;
