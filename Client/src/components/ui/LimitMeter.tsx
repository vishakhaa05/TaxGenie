import React from "react";
import { formatINR } from "@/features/income-tax/utils/formatINR";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface LimitMeterProps {
  current: number;
  limit: number;
  className?: string;
  showAmberWarning?: boolean;
}

export const LimitMeter: React.FC<LimitMeterProps> = ({
  current,
  limit,
  className = "",
  showAmberWarning = true,
}) => {
  const { t } = useTranslation();
  if (!limit || limit <= 0) return null;

  const isExceeded = current > limit;
  const effectiveCurrent = Math.min(current, limit);
  const percentage = Math.min(100, Math.round((current / limit) * 100));

  return (
    <div className={cn("space-y-1.5 mt-2", className)}>
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <span>
          {t("incomeTax.deductions.meterText", {
            current: formatINR(effectiveCurrent, { prefixSymbol: true }),
            limit: formatINR(limit, { prefixSymbol: true }),
            defaultValue: `${formatINR(effectiveCurrent, { prefixSymbol: true })} of ${formatINR(limit, { prefixSymbol: true })} used`,
          })}
        </span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            isExceeded
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-600 dark:text-slate-300"
          )}
        >
          {percentage}%
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isExceeded
              ? "bg-amber-500"
              : percentage >= 80
              ? "bg-indigo-500"
              : "bg-indigo-500/80"
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {/* Amber gentle warning when entered amount exceeds statutory limit */}
      {isExceeded && showAmberWarning && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg px-2.5 py-1.5 mt-1.5 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            {t("incomeTax.deductions.limitExceededNotice", {
              limit: formatINR(limit, { prefixSymbol: true }),
              defaultValue: `Only ${formatINR(limit, { prefixSymbol: true })} counts. We will use the limit.`,
            })}
          </span>
        </div>
      )}
    </div>
  );
};

export default LimitMeter;
