import { z } from "zod";
import { validateGstin } from "../engine/gst/gstin";

// Sanitizer to reject MongoDB operator keys ($) or nested dot notation
export function sanitizePayloadKeys(obj: any): boolean {
  if (!obj || typeof obj !== "object") return true;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      return false;
    }
    if (typeof obj[key] === "object" && obj[key] !== null) {
      if (!sanitizePayloadKeys(obj[key])) return false;
    }
  }
  return true;
}

export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const invoicePrefixRegex = /^[A-Za-z0-9-]+$/;
export const invoiceNumberRegex = /^[A-Za-z0-9/-]{1,16}$/;

export const businessProfileSchema = z.object({
  legalName: z.string().trim().min(1, "Legal business name is required").max(120),
  tradeName: z.string().trim().max(120).optional().or(z.literal("")),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .max(15)
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const res = validateGstin(val);
        return res.valid;
      },
      { message: "GSTIN is invalid or has incorrect checksum" }
    ),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .max(10)
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val === "") return true;
        return panRegex.test(val);
      },
      { message: "PAN must be in format ABCDE1234F" }
    ),
  address: z.string().trim().min(1, "Address is required").max(300),
  state: z.string().trim().min(1, "State is required").max(50),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Pincode must be 6 digits"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(100).optional().or(z.literal("")),
  invoicePrefix: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(8)
    .regex(invoicePrefixRegex, "Prefix must contain only letters, numbers, and hyphens")
    .default("INV"),
  numberPadding: z.number().int().min(1).max(8).default(4),
  resetEachFinancialYear: z.boolean().default(true),
  defaultPaymentTermsDays: z.number().int().min(0).max(365).default(15),
  defaultNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  defaultTerms: z.string().trim().max(1000).optional().or(z.literal("")),
  paymentDetailsText: z.string().trim().max(500).optional().or(z.literal("")),
  signatureLabel: z.string().trim().max(60).default("Authorised Signatory"),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required").max(120),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .max(15)
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const res = validateGstin(val);
        return res.valid;
      },
      { message: "Customer GSTIN is invalid or has incorrect checksum" }
    ),
  address: z.string().trim().min(1, "Customer address is required").max(300),
  state: z.string().trim().min(1, "Customer state is required").max(50),
  email: z.string().trim().email("Invalid customer email").max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required").max(200),
  hsnSac: z.string().trim().max(20).optional().or(z.literal("")),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().trim().max(20).default("NOS"),
  unitPricePaise: z.number().int().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  discountType: z.enum(["percent", "amount"]).default("amount"),
  discountValue: z.number().min(0).default(0),
  gstRate: z.number().refine((val) => [0, 5, 18, 40].includes(val), {
    message: "Rate must be 0, 5, 18, or 40%",
  }),
});

export const createInvoiceDraftSchema = z.object({
  documentType: z.enum(["tax_invoice", "bill_of_supply"]).default("tax_invoice"),
  customerId: z.string().optional(),
  buyer: z
    .object({
      name: z.string().trim().min(1, "Buyer name is required").max(120),
      gstin: z
        .string()
        .trim()
        .toUpperCase()
        .max(15)
        .optional()
        .or(z.literal(""))
        .refine(
          (val) => {
            if (!val || val === "") return true;
            return validateGstin(val).valid;
          },
          { message: "Buyer GSTIN is invalid" }
        ),
      address: z.string().trim().min(1, "Buyer address is required").max(300),
      state: z.string().trim().min(1, "Buyer state is required").max(50),
      email: z.string().trim().email().max(100).optional().or(z.literal("")),
      phone: z.string().trim().max(20).optional().or(z.literal("")),
    })
    .optional(),
  invoiceDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required").max(50, "Max 50 items allowed"),
  priceIncludesGst: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  terms: z.string().trim().max(1000).optional().or(z.literal("")),
  paymentDetailsText: z.string().trim().max(500).optional().or(z.literal("")),
});

export const guestPdfSchema = z.object({
  documentType: z.enum(["tax_invoice", "bill_of_supply"]).default("tax_invoice"),
  invoiceNumber: z
    .string()
    .trim()
    .min(1)
    .max(16)
    .regex(invoiceNumberRegex, "Invoice number must be letters, digits, hyphen, or slash (max 16 chars)"),
  invoiceDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
  seller: z.object({
    legalName: z.string().trim().min(1).max(120),
    tradeName: z.string().trim().max(120).optional().or(z.literal("")),
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .max(15)
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val || val === "") return true;
          return validateGstin(val).valid;
        },
        { message: "Seller GSTIN is invalid" }
      ),
    pan: z.string().trim().toUpperCase().max(10).optional().or(z.literal("")),
    address: z.string().trim().min(1).max(300),
    state: z.string().trim().min(1).max(50),
    pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/).optional().or(z.literal("")),
    phone: z.string().trim().max(20).optional().or(z.literal("")),
    email: z.string().trim().email().max(100).optional().or(z.literal("")),
    signatureLabel: z.string().trim().max(60).optional(),
  }),
  buyer: z.object({
    name: z.string().trim().min(1).max(120),
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .max(15)
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val || val === "") return true;
          return validateGstin(val).valid;
        },
        { message: "Buyer GSTIN is invalid" }
      ),
    address: z.string().trim().min(1).max(300),
    state: z.string().trim().min(1).max(50),
    email: z.string().trim().email().max(100).optional().or(z.literal("")),
    phone: z.string().trim().max(20).optional().or(z.literal("")),
  }),
  items: z.array(invoiceItemSchema).min(1).max(50),
  priceIncludesGst: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  terms: z.string().trim().max(1000).optional().or(z.literal("")),
  paymentDetailsText: z.string().trim().max(500).optional().or(z.literal("")),
});
