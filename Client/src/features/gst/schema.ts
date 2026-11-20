import { z } from "zod";

export const DEFAULT_ALLOWED_RATES = [0, 5, 18, 40] as const;

export const createGstFormSchema = (allowedRates: number[] = [0, 5, 18, 40]) =>
  z.object({
    mode: z.enum(["add", "remove"], {
      required_error: "errors.modeRequired",
    }),
    amount: z
      .number({
        required_error: "errors.amountRequired",
        invalid_type_error: "errors.amountRequired",
      })
      .gt(0, "errors.amountPositive")
      .max(1_000_000_000, "errors.amountMax") // 100 Crore
      .refine(
        (val) => {
          if (val === undefined || val === null) return false;
          const str = val.toString();
          const dot = str.indexOf(".");
          if (dot === -1) return true;
          return str.length - dot - 1 <= 2;
        },
        { message: "errors.amountDecimals" }
      ),
    rate: z
      .number({ required_error: "errors.rateRequired" })
      .refine((val) => allowedRates.includes(val), {
        message: "errors.rateInvalid",
      }),
    sellerState: z
      .string({ required_error: "errors.sellerStateRequired" })
      .min(1, "errors.sellerStateRequired"),
    buyerState: z
      .string({ required_error: "errors.buyerStateRequired" })
      .min(1, "errors.buyerStateRequired"),
    sameState: z.boolean(),
  });

export type GstFormData = z.infer<ReturnType<typeof createGstFormSchema>>;
