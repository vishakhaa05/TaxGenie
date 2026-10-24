import React from "react";
import { InfoTooltip } from "./InfoTooltip";
import { formatINR } from "@/features/income-tax/utils/formatINR";
import { cn } from "@/lib/utils";

interface FieldWithTooltipProps {
  id: string;
  label: string;
  tooltip?: string;
  example?: string;
  limit?: number;
  error?: string;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

export const FieldWithTooltip: React.FC<FieldWithTooltipProps> = ({
  id,
  label,
  tooltip,
  example,
  limit,
  error,
  children,
  className = "",
  badge,
}) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <label
            htmlFor={id}
            className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            {label}
          </label>
          {tooltip && <InfoTooltip content={tooltip} size={14} />}
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              {badge}
            </span>
          )}
        </div>

        {limit !== undefined && limit > 0 && (
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            Limit: {formatINR(limit, { prefixSymbol: true })}
          </span>
        )}
      </div>

      {children}

      {example && !error && (
        <p
          id={`${id}-example`}
          className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed"
        >
          {example}
        </p>
      )}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="text-xs font-medium text-rose-500 dark:text-rose-400"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default FieldWithTooltip;
