import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, requireCsrf } from "../middlewares/security.middleware";
import { InvoiceController } from "../controllers/invoice.controller";

const router = Router();

const isTest = process.env.NODE_ENV === "test";

const guestPdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: isTest ? 1000 : 5,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many guest invoice downloads from this IP. Please sign in or try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Guest endpoint: stateless PDF generator (rate limited, no login required)
router.post("/pdf", guestPdfLimiter, InvoiceController.guestPdf);

// Aggregations and exports (must be defined before /:id)
router.get("/summary", requireAuth, InvoiceController.getSummary);
router.get("/export.csv", requireAuth, InvoiceController.exportCsv);

// Logged-in invoice management
router.post("/", requireAuth, requireCsrf, InvoiceController.createDraft);
router.get("/", requireAuth, InvoiceController.listInvoices);

router.get("/:id", requireAuth, InvoiceController.getInvoice);
router.patch("/:id", requireAuth, requireCsrf, InvoiceController.updateDraft);
router.delete("/:id", requireAuth, requireCsrf, InvoiceController.deleteDraft);

// Invoice lifecycle actions
router.post("/:id/issue", requireAuth, requireCsrf, InvoiceController.issueInvoice);
router.post("/:id/mark-paid", requireAuth, requireCsrf, InvoiceController.markPaid);
router.post("/:id/mark-unpaid", requireAuth, requireCsrf, InvoiceController.markUnpaid);
router.post("/:id/cancel", requireAuth, requireCsrf, InvoiceController.cancelInvoice);
router.post("/:id/duplicate", requireAuth, requireCsrf, InvoiceController.duplicateInvoice);

// Owner PDF download
router.get("/:id/pdf", requireAuth, InvoiceController.downloadPdf);

export default router;
