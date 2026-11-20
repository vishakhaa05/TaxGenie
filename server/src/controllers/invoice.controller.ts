import { Request, Response, NextFunction } from "express";
import {
  createInvoiceDraftSchema,
  guestPdfSchema,
  sanitizePayloadKeys,
} from "../validators/invoice.validator";
import { InvoiceService } from "../services/invoice.service";
import { PdfService } from "../services/pdf.service";
import { CsvExportService } from "../services/csv-export.service";
import { getInvoiceMonthlySummary, listUserInvoices } from "../utils/localStore";

export class InvoiceController {
  public static async createDraft(req: Request, res: Response, next: NextFunction) {
    try {
      if (!sanitizePayloadKeys(req.body)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PAYLOAD",
            message: "Payload contains forbidden keys",
          },
        });
      }

      const parsed = createInvoiceDraftSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid invoice draft payload",
            details: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const draft = await InvoiceService.createDraft(userId, parsed.data);

      return res.status(201).json({
        success: true,
        data: draft,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const { status, q, from, to, customerId, sort, page, limit } = req.query;

      const result = await InvoiceService.listInvoices(userId, {
        status: typeof status === "string" ? status : undefined,
        q: typeof q === "string" ? q : undefined,
        from: typeof from === "string" ? from : undefined,
        to: typeof to === "string" ? to : undefined,
        customerId: typeof customerId === "string" ? customerId : undefined,
        sort: typeof sort === "string" ? sort : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const invoice = await InvoiceService.getInvoice(userId, req.params.id as string);

      return res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateDraft(req: Request, res: Response, next: NextFunction) {
    try {
      if (!sanitizePayloadKeys(req.body)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PAYLOAD",
            message: "Payload contains forbidden keys",
          },
        });
      }

      const parsed = createInvoiceDraftSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid invoice update payload",
            details: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const updated = await InvoiceService.updateDraft(userId, req.params.id as string, parsed.data);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      await InvoiceService.deleteDraft(userId, req.params.id as string);

      return res.status(200).json({
        success: true,
        message: "Invoice draft deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  public static async issueInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const issued = await InvoiceService.issueInvoice(userId, req.params.id as string);

      return res.status(200).json({
        success: true,
        data: issued,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const updated = await InvoiceService.markPaid(userId, req.params.id as string);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async markUnpaid(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const updated = await InvoiceService.markUnpaid(userId, req.params.id as string);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async cancelInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const cancelled = await InvoiceService.cancelInvoice(userId, req.params.id as string);

      return res.status(200).json({
        success: true,
        data: cancelled,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async duplicateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const duplicated = await InvoiceService.duplicateInvoice(userId, req.params.id as string);

      return res.status(201).json({
        success: true,
        data: duplicated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const invoice = await InvoiceService.getInvoice(userId, req.params.id as string);

      const pdfBuffer = await PdfService.generateInvoicePdf(invoice);

      const rawNumber = invoice.invoiceNumber || `DRAFT-${invoice._id || invoice.id}`;
      const safeFilename = `${rawNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);

      return res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  public static async guestPdf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!sanitizePayloadKeys(req.body)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PAYLOAD",
            message: "Payload contains forbidden keys",
          },
        });
      }

      const parsed = guestPdfSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid guest invoice payload",
            details: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const input = parsed.data;

      // Pure stateless recomputation on server
      const engineResult = await InvoiceService.computeTotals(
        input.items,
        input.seller.state,
        input.buyer.state,
        input.priceIncludesGst,
        input.documentType
      );

      const invoiceData = {
        ...input,
        engineResult,
      };

      const pdfBuffer = await PdfService.generateInvoicePdf(invoiceData);
      const safeFilename = `${input.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);

      return res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  public static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const month = typeof req.query.month === "string" ? req.query.month : undefined;
      const summary = await getInvoiceMonthlySummary(userId, month);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const { status, from, to } = req.query;

      const { invoices } = await listUserInvoices(userId, {
        status: typeof status === "string" ? status : undefined,
        from: typeof from === "string" ? from : undefined,
        to: typeof to === "string" ? to : undefined,
        limit: 500,
      });

      const csv = CsvExportService.generateInvoicesCsv(invoices);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="invoices-export.csv"');

      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
