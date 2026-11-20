import React from "react";
import { useTranslation } from "react-i18next";

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const { t } = useTranslation();

  const getScore = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: "", color: "bg-slate-200 dark:bg-slate-700" };

    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    // Purely digits check
    if (/^\d+$/.test(pass)) {
      return { score: 1, label: t("auth.strengthWeak") || "Too weak (digits only)", color: "bg-rose-500" };
    }

    if (score <= 1) {
      return { score: 1, label: t("auth.strengthWeak") || "Weak", color: "bg-rose-500" };
    }
    if (score === 2) {
      return { score: 2, label: t("auth.strengthFair") || "Fair", color: "bg-amber-500" };
    }
    if (score === 3) {
      return { score: 3, label: t("auth.strengthGood") || "Good", color: "bg-sky-500" };
    }
    return { score: 4, label: t("auth.strengthStrong") || "Strong", color: "bg-emerald-500" };
  };

  const { score, label, color } = getScore(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`flex-1 rounded-full transition-all duration-300 ${
              score >= step ? color : "bg-slate-200 dark:bg-slate-800"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
        <span>{t("auth.passwordStrength") || "Strength"}:</span>
        <span className="font-semibold">{label}</span>
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
