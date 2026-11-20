import { Request, Response, NextFunction } from "express";
import { customerSchema, sanitizePayloadKeys } from "../validators/invoice.validator";
import { CustomerService } from "../services/customer.service";

export class CustomerController {
  public static async listCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const customers = await CustomerService.listCustomers(userId, q);

      return res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const customer = await CustomerService.getCustomer(userId, req.params.id as string);

      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createCustomer(req: Request, res: Response, next: NextFunction) {
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

      const parsed = customerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid customer data",
            details: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const customer = await CustomerService.createCustomer(userId, parsed.data);

      return res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCustomer(req: Request, res: Response, next: NextFunction) {
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

      const parsed = customerSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid customer update data",
            details: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      const updated = await CustomerService.updateCustomer(userId, req.params.id as string, parsed.data);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String((req as any).user?._id || (req as any).user?.id || "");
      await CustomerService.deleteCustomer(userId, req.params.id as string);

      return res.status(200).json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
