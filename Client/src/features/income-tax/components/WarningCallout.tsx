import React from "react";
import { useTranslation } from "react-i18next";
import { TaxWarning, TaxWarningCode } from "../types";
import { formatINR } from "../utils/formatINR";
import { AlertTriangle, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningCalloutProps {
  warnings: TaxWarning[];
  className?: string;
}

export const WarningCallout: React.FC<WarningCalloutProps> = ({
  warnings,
  className = "",
}) => {
  const { t } = useTranslation();

  if (!warnings || warnings.length === 0) return null;

  // Deduplicate warnings by code and stringified params
  const uniqueWarnings = Array.from(
    new Map(warnings.map((w) => [`${w.code}-${JSON.stringify(w.params || {})}`, w])).values()
  );

  const getWarningConfig = (code: TaxWarningCode, params?: Record<string, any>) => {
    // Format numeric values in params with INR
    const formattedParams: Record<string, any> = { ...params };
    if (params?.allowed !== undefined) {
      formattedParams.allowed = formatINR(params.allowed);
    }
    if (params?.entered !== undefined) {
      formattedParams.entered = formatINR(params.entered);
    }
    if (params?.otherIncome !== undefined) {
      formattedParams.otherIncome = formatINR(params.otherIncome);
    }
    if (params?.threshold !== undefined) {
      formattedParams.threshold = formatINR(params.threshold);
    }

    switch (code) {
      case "DEDUCTION_CAPPED":
        return {
          type: "amber" as const,
          icon: <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
          title: t("incomeTax.warningTitle.deductionCapped", "Deduction Limit Reached"),
          message: String(t("tax.warning.DEDUCTION_CAPPED", formattedParams)),
        };

      case "SURCHARGE_NOT_INCLUDED":
        return {
          type: "amber" as const,
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
          title: t("incomeTax.warningTitle.surchargeNotice", "High Income Surcharge Notice"),
          message: String(t("tax.warning.SURCHARGE_NOT_INCLUDED", formattedParams)),
        };

      case "REBATE_APPLIED":
        return {
          type: "info" as const,
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
          title: t("incomeTax.warningTitle.rebateApplied", "Section 87A Full Rebate"),
          message: String(t("tax.warning.REBATE_APPLIED", formattedParams)),
        };

      case "MARGINAL_RELIEF_APPLIED":
        return {
          type: "info" as const,
          icon: <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />,
          title: t("incomeTax.warningTitle.marginalRelief", "Marginal Relief Protection"),
          message: String(t("tax.warning.MARGINAL_RELIEF_APPLIED", formattedParams)),
        };

      case "OTHER_INCOME_NO_STANDARD_DEDUCTION":
        return {
          type: "info" as const,
          icon: <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />,
          title: t("incomeTax.warningTitle.otherIncome", "Standard Deduction Rule"),
          message: String(t("tax.warning.OTHER_INCOME_NO_STANDARD_DEDUCTION", formattedParams)),
        };

      default:
        return {
          type: "info" as const,
          icon: <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />,
          title: t("incomeTax.warningTitle.note", "Calculation Note"),
          message: JSON.stringify(params || {}),
        };
    }
  };

  return (
    <div className={cn("space-y-3", className)} role="region" aria-label="Tax calculation callouts">
      {uniqueWarnings.map((warning, index) => {
        const { type, icon, title, message } = getWarningConfig(
          warning.code,
          warning.params
        );

        return (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm animate-in fade-in duration-200",
              type === "amber"
                ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200"
                : "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-950 dark:text-indigo-200"
            )}
          >
            {icon}
            <div className="space-y-0.5">
              <p
                className={cn(
                  "font-bold text-xs uppercase tracking-wider",
                  type === "amber"
                    ? "text-amber-900 dark:text-amber-300"
                    : "text-indigo-900 dark:text-indigo-300"
                )}
              >
                {title}
              </p>
              <p className="leading-relaxed opacity-95">{message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WarningCallout;
