import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Logo from "@/components/logo/logo";
import { forgotPasswordApi } from "@/auth/api";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      await forgotPasswordApi(data);
      // Generic success message to prevent email enumeration
      setSubmitted(true);
    } catch {
      // Still display generic success message
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-br from-slate-900 via-[#0B1120] to-[#1E1B4B] text-slate-100">
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo url="/" size="lg" theme="dark" />
          <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
            {t("auth.resetPasswordTitle") || "Reset your password"}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs">
            {t("auth.forgotSubtitle") || "Enter your registered email address to receive password reset instructions."}
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
          {submitted ? (
            <div className="text-center space-y-4 py-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-white">
                {t("auth.resetLinkSentTitle") || "Instructions Dispatched"}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("auth.resetLinkSentText") ||
                  "If this email address is registered with TaxGenie, we have sent a secure password reset link. Please check your inbox and spam folder."}
              </p>
              <div className="pt-4 border-t border-slate-800">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  <span>{t("auth.backToLogin") || "Return to Sign In"}</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t("auth.emailAddress") || "Email Address"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("auth.sending") || "Sending instructions..."}</span>
                  </>
                ) : (
                  <>
                    <span>{t("auth.sendResetLink") || "Send Password Reset Link"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                <Link to="/login" className="text-slate-400 hover:text-white underline">
                  {t("auth.backToLogin") || "Back to Sign In"}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
