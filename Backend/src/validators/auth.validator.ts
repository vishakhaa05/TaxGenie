import { z } from "zod";
import { validatePasswordStrength } from "../utils/password";

export const emailSchema = z
  .string({ required_error: "errors.emailRequired" })
  .trim()
  .toLowerCase()
  .email("errors.emailInvalid")
  .max(255);

export const strongPasswordSchema = z
  .string({ required_error: "errors.passwordRequired" })
  .superRefine((val, ctx) => {
    const result = validatePasswordStrength(val);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.messageKey || "errors.passwordInvalid",
      });
    }
  });

export const registerSchema = z.object({
  name: z.string({ required_error: "errors.nameRequired" }).trim().min(2, "errors.nameMin").max(100),
  email: emailSchema,
  password: strongPasswordSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z
    .string({ required_error: "errors.otpRequired" })
    .trim()
    .length(6, "errors.otpLength")
    .regex(/^\d{6}$/, "errors.otpDigitsOnly"),
});

export const resendOtpSchema = z.object({
  email: emailSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: "errors.passwordRequired" }).min(1, "errors.passwordRequired"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: "errors.tokenRequired" }).min(10, "errors.tokenInvalid"),
  newPassword: strongPasswordSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  language: z.enum(["en", "hi"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  defaultState: z.string().min(1).optional(),
  ageGroup: z.enum(["general", "senior", "superSenior", "below60", "senior60to79", "superSenior80plus"]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "errors.currentPasswordRequired"),
  newPassword: strongPasswordSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "errors.passwordRequired"),
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type VerifyOtpSchemaType = z.infer<typeof verifyOtpSchema>;
export type ResendOtpSchemaType = z.infer<typeof resendOtpSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;
export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileSchemaType = z.infer<typeof updateProfileSchema>;
export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>;
export type DeleteAccountSchemaType = z.infer<typeof deleteAccountSchema>;
