import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Logo from "@/components/logo/logo";
import { useAuth } from "@/auth/useAuth";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resendOtp } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailValue = watch("email");

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      setUnverifiedEmail(null);

      await login(data);
      toast.success(t("auth.loginSuccess") || "Logged in successfully!");

      const returnPath = (location.state as any)?.from?.pathname || "/";
      navigate(returnPath, { replace: true });
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(data.email);
        setServerError(
          t("auth.emailNotVerifiedPrompt") ||
            "Your email address has not been verified yet. Please enter the OTP to activate your account."
        );
      } else if (code === "ACCOUNT_LOCKED") {
        setServerError(
          err?.message ||
            t("auth.accountLocked") ||
            "Account temporarily locked due to repeated failed login attempts. Please wait 15 minutes."
        );
      } else {
        setServerError(
          t("auth.invalidCredentials") || "Invalid email or password. Please check your credentials."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPrompt = async () => {
    const targetEmail = unverifiedEmail || emailValue;
    if (!targetEmail) return;

    try {
      setIsResending(true);
      await resendOtp({ email: targetEmail });
      toast.success(t("auth.otpSentToast") || "Fresh verification code sent to your email!");
      navigate("/verify-email", { state: { email: targetEmail } });
    } catch (e: any) {
      navigate("/verify-email", { state: { email: targetEmail } });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-br from-slate-900 via-[#0B1120] to-[#1E1B4B] text-slate-100">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo url="/" size="lg" theme="dark" />
          <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
            {t("auth.welcomeBack") || "Welcome back to TaxGenie"}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs">
            {t("auth.loginSubtitle") || "Sign in to access your saved tax & GST records and live dashboard."}
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{serverError}</span>
                {unverifiedEmail && (
                  <button
                    type="button"
                    onClick={handleVerifyPrompt}
                    disabled={isResending}
                    className="mt-2 block font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    {isResending ? "Sending code..." : "Click here to verify your email now &rarr;"}
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Address */}
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

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {t("auth.password") || "Password"}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                >
                  {t("auth.forgotPassword") || "Forgot password?"}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("auth.signingIn") || "Signing in..."}</span>
                </>
              ) : (
                <>
                  <span>{t("auth.signInBtn") || "Sign In to TaxGenie"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {t("auth.dontHaveAccount") || "Don't have an account?"}{" "}
            <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 underline">
              {t("auth.signUpLink") || "Create one for free"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
