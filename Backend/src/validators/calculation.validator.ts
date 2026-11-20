import { z } from "zod";

export const saveCalculationSchema = z.object({
  type: z.enum(["income_tax", "gst"], {
    required_error: "errors.typeRequired",
  }),
  name: z.string().trim().max(120).optional(),
  taxYear: z.string().default("2026-27").optional(),
  inputs: z.record(z.any(), {
    required_error: "errors.inputsRequired",
  }),
});

export const renameCalculationSchema = z.object({
  name: z
    .string({ required_error: "errors.nameRequired" })
    .trim()
    .min(1, "errors.nameRequired")
    .max(120, "errors.nameTooLong"),
});

export const listCalculationsQuerySchema = z.object({
  type: z.enum(["income_tax", "gst"]).optional(),
  taxYear: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["latest", "oldest", "amount_desc", "amount_asc"]).default("latest").optional(),
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
});

export type SaveCalculationSchemaType = z.infer<typeof saveCalculationSchema>;
export type RenameCalculationSchemaType = z.infer<typeof renameCalculationSchema>;
export type ListCalculationsQueryType = z.infer<typeof listCalculationsQuerySchema>;
