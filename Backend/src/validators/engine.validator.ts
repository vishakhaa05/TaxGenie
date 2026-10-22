import { z } from "zod";

export const taxCalculateSchema = z.object({
  ageGroup: z.enum(["below60", "senior", "superSenior"], {
    errorMap: () => ({
      message: "ageGroup must be one of: 'below60', 'senior', 'superSenior'",
    }),
  }),
  salaryIncome: z
    .number({ required_error: "salaryIncome is required" })
    .int("salaryIncome must be a whole rupee integer")
    .min(0, "salaryIncome cannot be negative"),
  otherIncome: z
    .number()
    .int("otherIncome must be a whole rupee integer")
    .min(0, "otherIncome cannot be negative")
    .optional()
    .default(0),
  taxYear: z
    .string({ required_error: "taxYear is required" })
    .min(1, "taxYear cannot be empty"),
  deductions: z
    .object({
      sec80C: z.number().int().min(0).optional(),
      sec80CCD1B: z.number().int().min(0).optional(),
      sec80D_selfFamily: z.number().int().min(0).optional(),
      sec80D_parents: z.number().int().min(0).optional(),
      parentsAreSenior: z.boolean().optional(),
      homeLoanInterest: z.number().int().min(0).optional(),
      hra: z
        .object({
          basicSalary: z.number().int().min(0),
          hraReceived: z.number().int().min(0),
          rentPaid: z.number().int().min(0),
          isMetro: z.boolean(),
        })
        .optional(),
    })
    .optional(),
});

export const gstCalculateSchema = z.object({
  amount: z
    .number({ required_error: "amount is required" })
    .min(0, "amount cannot be negative"),
  rate: z
    .number({ required_error: "rate is required" })
    .min(0, "rate cannot be negative"),
  mode: z.enum(["add", "remove"], {
    errorMap: () => ({ message: "mode must be either 'add' or 'remove'" }),
  }),
  sellerState: z
    .string({ required_error: "sellerState is required" })
    .min(1, "sellerState cannot be empty"),
  buyerState: z
    .string({ required_error: "buyerState is required" })
    .min(1, "buyerState cannot be empty"),
  taxYear: z.string().optional().default("2026-27"),
});

export const invoiceItemSchema = z.object({
  name: z.string({ required_error: "Item name is required" }).min(1),
  hsnOrSac: z.string().optional(),
  quantity: z
    .number({ required_error: "quantity is required" })
    .positive("quantity must be greater than zero"),
  unitPrice: z
    .number({ required_error: "unitPrice is required" })
    .min(0, "unitPrice cannot be negative"),
  rate: z
    .number({ required_error: "rate is required" })
    .min(0, "rate cannot be negative"),
  discount: z.number().min(0).optional().default(0),
});

export const invoicePreviewSchema = z.object({
  items: z
    .array(invoiceItemSchema)
    .min(1, "Invoice must contain at least one item"),
  sellerState: z
    .string({ required_error: "sellerState is required" })
    .min(1, "sellerState cannot be empty"),
  buyerState: z
    .string({ required_error: "buyerState is required" })
    .min(1, "buyerState cannot be empty"),
  priceIncludesGst: z.boolean().optional().default(false),
  taxYear: z.string().optional().default("2026-27"),
});

export const validateGstinSchema = z.object({
  gstin: z
    .string({ required_error: "gstin is required" })
    .min(1, "gstin cannot be empty"),
});
