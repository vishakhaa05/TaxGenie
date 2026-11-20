import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, ArrowRight, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import Logo from "@/components/logo/logo";
import { useAuth } from "@/auth/useAuth";
import { toast } from "sonner";

export const VerifyEmailPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp } = useAuth();

  const email = (location.state as any)?.email || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second countdown timer for resending OTP
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    setErrorMessage(null);

    // Only allow digits
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    // Single digit input
    const char = cleaned.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = char;
    setOtp(nextOtp);

    // Auto-advance to next input
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 boxes filled
    if (nextOtp.every((digit) => digit.length === 1)) {
      handleVerify(nextOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous box on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().replace(/\D/g, "");
    if (!pasteData) return;

    const digits = pasteData.slice(0, 6).split("");
    const nextOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < 6) nextOtp[idx] = digit;
    });
    setOtp(nextOtp);

    const focusIndex = Math.min(digits.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (nextOtp.every((digit) => digit.length === 1)) {
      handleVerify(nextOtp.join(""));
    }
  };

  const handleVerify = async (code: string) => {
    if (!email) {
      setErrorMessage(t("auth.emailMissingError") || "Email missing. Please return to login or register.");
      return;
    }

    if (code.length !== 6) {
      setErrorMessage(t("auth.otpIncomplete") || "Please enter all 6 digits.");
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage(null);

      await verifyOtp({ email, otp: code });
      toast.success(t("auth.emailVerifiedSuccess") || "Email verified successfully!");

      const returnPath = (location.state as any)?.from?.pathname || "/";
      navigate(returnPath, { replace: true });
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "INVALID_OTP") {
        setErrorMessage(t("auth.invalidOtpError") || "Incorrect code. Please double-check and try again.");
      } else if (code === "OTP_EXPIRED") {
        setErrorMessage(t("auth.expiredOtpError") || "This code has expired. Please request a new one.");
      } else if (code === "TOO_MANY_ATTEMPTS") {
        setErrorMessage(t("auth.tooManyAttemptsError") || "Maximum attempts reached. Please request a fresh OTP.");
      } else {
        setErrorMessage(err?.message || t("auth.verificationFailed") || "Verification failed. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || !email) return;

    try {
      setIsResending(true);
      setErrorMessage(null);

      await resendOtp({ email });
      toast.success(t("auth.otpResentSuccess") || "New verification code sent!");
      setCooldownSeconds(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err?.message || t("auth.resendFailed") || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-br from-slate-900 via-[#0B1120] to-[#1E1B4B] text-slate-100">
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo url="/" size="lg" theme="dark" />
          <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
            {t("auth.verifyEmailTitle") || "Verify your email"}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs">
            {t("auth.verifyEmailSubtitle") || "Enter the 6-digit code sent to:"}{" "}
            <span className="font-semibold text-indigo-400">{email || "your email address"}</span>
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
          {errorMessage && (
            <div className="mb-6 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 6 OTP Input Boxes */}
          <div className="flex justify-center gap-2 sm:gap-3 my-6">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold rounded-2xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
                aria-label={`OTP digit ${idx + 1}`}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={() => handleVerify(otp.join(""))}
            disabled={isVerifying || otp.some((d) => !d)}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("auth.verifying") || "Verifying code..."}</span>
              </>
            ) : (
              <>
                <span>{t("auth.verifyCodeBtn") || "Verify & Continue"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Resend OTP Section with Countdown */}
          <div className="mt-6 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
            <span>{t("auth.didntReceiveCode") || "Didn't receive the email?"}</span>
            {cooldownSeconds > 0 ? (
              <span className="text-slate-500 font-medium">
                {t("auth.resendCountdown", { seconds: cooldownSeconds }) || `Resend available in ${cooldownSeconds}s`}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isResending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{t("auth.resendCode") || "Resend Code"}</span>
              </button>
            )}
          </div>

          {/* Back to Login Link */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <Link to="/login" className="text-slate-400 hover:text-white underline">
              {t("auth.backToLogin") || "Back to Sign In"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
