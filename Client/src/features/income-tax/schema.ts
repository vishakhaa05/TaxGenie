import { z } from "zod";

const MAX_SENSIBLE_AMOUNT = 1000000000; // 100 Crore

export const ageGroupSchema = z.enum(["below60", "senior", "superSenior"], {
  errorMap: () => ({ message: "incomeTax.validation.ageRequired" }),
});

export const step1Schema = z.object({
  ageGroup: ageGroupSchema,
  taxYear: z.string().min(1, "incomeTax.validation.yearRequired"),
});

export const step2Schema = z.object({
  salaryPeriod: z.enum(["yearly", "monthly"]),
  salaryAmount: z
    .number({
      required_error: "incomeTax.validation.salaryRequired",
      invalid_type_error: "incomeTax.validation.validNumberRequired",
    })
    .int("incomeTax.validation.wholeNumberOnly")
    .min(0, "incomeTax.validation.nonNegative")
    .max(MAX_SENSIBLE_AMOUNT, "incomeTax.validation.amountTooHigh"),
  otherIncome: z
    .number({
      invalid_type_error: "incomeTax.validation.validNumberRequired",
    })
    .int("incomeTax.validation.wholeNumberOnly")
    .min(0, "incomeTax.validation.nonNegative")
    .max(MAX_SENSIBLE_AMOUNT, "incomeTax.validation.amountTooHigh"),
});

export const step3Schema = z
  .object({
    sec80C: z
      .number()
      .int("incomeTax.validation.wholeNumberOnly")
      .min(0, "incomeTax.validation.nonNegative")
      .max(MAX_SENSIBLE_AMOUNT, "incomeTax.validation.amountTooHigh"),
    sec80CCD1B: z
      .number()
      .int("incomeTax.validation.wholeNumberOnly")
      .min(0, "incomeTax.validation.nonNegative")
      .max(MAX_SENSIBLE_AMOUNT, "incomeTax.validation.amountTooHigh"),
    sec80D_selfFamily: z
      .number()
      .int("incomeTax.validation.wholeNumberOnly")
      .min(0, "incomeTax.validation.nonNegative")
      .max(MAX_SENSIBLE_AMOUNT, "incomeTax.validation.amountTooHigh"),
    sec80D_parents: z
      .number()
      .int("incomeTax.validation.wholeNumberOnly")
      .min(0, "incomeTax.validation.nonNegative")
      .max(MAX_SENSIBLE_AMOUNT, "incomeTax.validation.amountTooHigh"),
    parentsAreSenior: z.boolean(),
    homeLoanInterest: z
      .number()
      .int("incomeTax.validation.wholeNumberOnly")
      .min(0, "incomeTax.validation.nonNegative")
      .max(MAX_SENSIBLE_AMOUNT, "incomeTax.validation.amountTooHigh"),

    hasHra: z.boolean(),
    hraBasicSalary: z
      .number()
      .int("incomeTax.validation.wholeNumberOnly")
      .min(0, "incomeTax.validation.nonNegative")
      .max(MAX_SENSIBLE_AMOUNT, "incomeTax.validation.amountTooHigh"),
    hraReceived: z
      .number()
      .int("incomeTax.validation.wholeNumberOnly")
      .min(0, "incomeTax.validation.nonNegative")
      .max(MAX_SENSIBLE_AMOUNT, "incomeTax.validation.amountTooHigh"),
    hraRentPaid: z
      .number()
      .int("incomeTax.validation.wholeNumberOnly")
      .min(0, "incomeTax.validation.nonNegative")
      .max(MAX_SENSIBLE_AMOUNT, "incomeTax.validation.amountTooHigh"),
    hraIsMetro: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.hasHra) {
      if (data.hraReceived > 0 && data.hraBasicSalary <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "incomeTax.validation.basicSalaryRequiredForHra",
          path: ["hraBasicSalary"],
        });
      }
    }
  });

export const fullWizardSchema = step1Schema.merge(step2Schema).and(step3Schema);

export type Step1FormValues = z.infer<typeof step1Schema>;
export type Step2FormValues = z.infer<typeof step2Schema>;
export type Step3FormValues = z.infer<typeof step3Schema>;
export type FullWizardFormValues = z.infer<typeof fullWizardSchema>;
